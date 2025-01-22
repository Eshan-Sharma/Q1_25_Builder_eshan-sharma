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
pub struct Initialize {}
