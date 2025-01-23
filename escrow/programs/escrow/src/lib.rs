use anchor_lang::prelude::*;

declare_id!("7JhnKE64RxpA87SeqUU1PDGvrM5qTxxsecUaLn5tYsg");

#[program]
pub mod escrow {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
