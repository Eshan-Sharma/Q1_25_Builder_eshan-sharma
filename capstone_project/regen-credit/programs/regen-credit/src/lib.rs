use anchor_lang::prelude::*;

declare_id!("BVHV15bav5SCp5DMnXPZ5qVHNFykmxhMQ3RsFaHEC9oU");
pub mod context;
pub mod state;
#[program]
pub mod regen_credit {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
