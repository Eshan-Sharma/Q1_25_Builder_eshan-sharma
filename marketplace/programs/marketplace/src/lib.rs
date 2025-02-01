use anchor_lang::prelude::*;
pub mod contexts;
pub mod state;
declare_id!("Cst1bMdLbmrAdYMdnCWmaJceDSnjuhNNw6JMVPwJe4uo");

#[program]
pub mod marketplace {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
