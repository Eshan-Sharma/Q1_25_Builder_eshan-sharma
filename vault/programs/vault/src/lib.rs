use anchor_lang::prelude::*;

declare_id!("9obV7p79e8z5p3FrnGiW13mhYR5eJbWB1GpbkRyjKkW3");

#[program]
pub mod vault {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub signer: Signer<'info>,
    #[account(init,payer=signer,space=8+VaultState::INIT_SPACE,seeds=[b"state",signer.key().as_ref()],bump)]
    pub vault_state: Account<'info, VaultState>,
    #[account(seeds=[b"vault",vault_state.key().as_ref()],bump)]
    pub vault: SystemAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct VaultState {
    pub vault_bump: u8,
    pub state_bump: u8,
}
