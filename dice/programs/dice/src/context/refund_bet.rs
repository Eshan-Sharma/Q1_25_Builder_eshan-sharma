use anchor_lang::prelude::*;
use anchor_lang::system_program::{transfer, Transfer};

use crate::state::Bet;
use crate::state::CustomError;
#[derive(Accounts)]
#[instruction(seed:u128)]
pub struct RefundBet<'info> {
    #[account(mut)]
    pub player: Signer<'info>,
    pub house: SystemAccount<'info>,
    #[account(
        mut, 
        seeds = [b"vault", house.key().as_ref()],
        bump
    )]
    pub vault: SystemAccount<'info>,
    #[account(
        mut,
        close=player,
        seeds = [b"bet", vault.key().as_ref(),seed.to_le_bytes().as_ref()],
        bump
    )]
    pub bet:Account<'info,Bet>,
    pub system_program:Program<'info, System>
}

impl<'info> RefundBet<'info>{
    pub fn refund_and_close_bet(&mut self, bumps:&RefundBetBumps)->Result<()>{
        let slot = Clock::get()?.slot;
        require!((self.bet.slot-slot)>1000,CustomError::TimeoutNotReached);
        
        let cpi_program = self.system_program.to_account_info();
        let cpi_accounts = Transfer{
            from:self.vault.to_account_info(),
            to:self.player.to_account_info()
        };
        let seeds = [b"vault", &self.house.key().to_bytes()[..], &[bumps.vault]];
        let signer_seeds = &[&seeds[..]][..];

        let ctx_cpi = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        transfer(ctx_cpi, self.bet.amount)?;
        Ok(())
    }
}