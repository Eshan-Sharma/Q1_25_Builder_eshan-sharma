use anchor_lang::prelude::*;

declare_id!("6hPSfTZAR4HCQTeiS9HTap43VkPP4mvGcUPSNyuycaBD");
pub mod context;
pub mod state;
#[program]
pub mod staking {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
