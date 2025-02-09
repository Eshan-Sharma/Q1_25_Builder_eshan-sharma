use anchor_lang::prelude::*;

declare_id!("7sQSfqt7sJ96D1zBK3GgPTj5hpWWMc5cJoGDpLPCtwbg");
pub mod context;
pub mod state;
#[program]
pub mod dice {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
