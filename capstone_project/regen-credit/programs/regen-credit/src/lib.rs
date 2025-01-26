use anchor_lang::prelude::*;

declare_id!("7icpggagPeZMw5WjuVQ3LSwXQag5qs4Ensev3i1ANqiC");

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
