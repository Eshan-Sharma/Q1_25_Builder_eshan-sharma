use anchor_lang::{prelude::*, system_program::{Transfer, transfer}};
use anchor_instruction_sysvar::Ed25519InstructionSignatures;
use solana_program::{sysvar::instructions::load_instruction_at_checked, ed25519_program, hash::hash};

use crate::state::Bet;
use crate::state::CustomError;

#[derive(Accounts)]
pub struct ResolveBets<'info> {
    pub house: Signer<'info>,
    #[account(mut)]
    pub player: SystemAccount<'info>,
    #[account(
        mut, 
        seeds = [b"vault", house.key().as_ref()],
        bump
    )]
    pub vault:SystemAccount<'info>,
    #[account(
        mut, 
        close=player,
        seeds = [b"bet", vault.key().as_ref(),bet.seed.to_le_bytes().as_ref()],
        bump
    )]
    pub bet:Account<'info, Bet>,
    #[account(
        address = solana_program::sysvar::instructions::ID
    )]
    pub instructions_sysvar:AccountInfo<'info>,
    pub system_program:Program<'info, System>
}
impl<'info> ResolveBets<'info>{
    pub fn verify_ed25519_signature(&mut self,sig:&[u8])->Result<()>{
        let ix = load_instruction_at_checked(0, &self.instructions_sysvar.to_account_info()).unwrap();
        require_keys_eq!(ix.program_id, ed25519_program::ID, CustomError::Ed25519Program);
        require_eq!(ix.accounts.len(), 0, CustomError::Ed25519Accounts);
        
        let signatures = Ed25519InstructionSignatures::unpack(&ix.data)?.0;

        require_eq!(signatures.len(), 1, CustomError::Ed25519DataLength);
        let program_signature = &signatures[0];

        // Verifications
        require!(program_signature.is_verifiable, CustomError::Ed25519Header);
        require_keys_eq!(program_signature.public_key.ok_or(CustomError::Ed25519Pubkey)?, self.house.key(), CustomError::Ed25519Pubkey);
        require!(&program_signature.signature.ok_or(CustomError::Ed25519Signature)?.eq(sig), CustomError::Ed25519Signature);
        require!(&program_signature.message.as_ref().ok_or(CustomError::Ed25519Signature)?.eq(&self.bet.to_slice()), CustomError::Ed25519Signature);
        
        Ok(())
    }

    pub fn resolve_bets(&mut self, bumps:&ResolveBetsBumps,sig:&[u8])->Result<()>{
        let hash = hash(sig).to_bytes();
        let mut hash_16: [u8;16]=[0;16];
        hash_16.copy_from_slice(&hash[0..16]);
        let lower = u128::from_le_bytes(hash_16);
        hash_16.copy_from_slice(&hash[16..32]);
        let upper = u128::from_le_bytes(hash_16);

        let roll = lower.wrapping_add(upper).wrapping_rem(100) as u8 + 1;
        if self.bet.roll > roll{
            let payout= (self.bet.amount as u128)
                .checked_mul(10000 - 150 as u128).ok_or(CustomError::Overflow)?
                .checked_div(self.bet.roll as u128 - 1).ok_or(CustomError::Overflow)?
                .checked_div(100).ok_or(CustomError::Overflow)? as u64;

            let cpi_accounts = Transfer {
                from: self.vault.to_account_info(),
                to: self.player.to_account_info()
            };

            let seeds = [b"vault", &self.house.key().to_bytes()[..], &[bumps.vault]];
            let signer_seeds = &[&seeds[..]][..];
    
            let cpi_ctx = CpiContext::new_with_signer(
                self.system_program.to_account_info(),
                cpi_accounts,
                signer_seeds
            );
            transfer(cpi_ctx, payout)?;
        }
        
        Ok(())
    }
}