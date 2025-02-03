use anchor_lang::prelude::*;
pub mod contexts;
pub mod state;
declare_id!("2TMjuyHhBXCHfJYsuSNRGCmzXVkWVFo5PCWUNcfmCyXT");

#[program]
pub mod amm {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
