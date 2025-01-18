use anchor_lang::prelude::*;

declare_id!("5UXHK6Gcgxsfb8FYVB9Y46SPccwH16fP1gzvUXjeUkG");

#[program]
pub mod hello_world {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}

//Deployed on Program Id: 5UXHK6Gcgxsfb8FYVB9Y46SPccwH16fP1gzvUXjeUkG
