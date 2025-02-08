use anchor_lang::prelude::*;

declare_id!("6hPSfTZAR4HCQTeiS9HTap43VkPP4mvGcUPSNyuycaBD");
pub mod context;
pub mod state;
pub use context::*;
#[program]
pub mod staking {
    use super::*;
    pub fn init_config(
        ctx: Context<InitializeConfig>,
        points_per_stake: u8,
        max_state: u8,
        freeze_period: u32,
    ) -> Result<()> {
        ctx.accounts
            .init(&ctx.bumps, points_per_stake, max_state, freeze_period)?;
        Ok(())
    }

    pub fn init_user(ctx: Context<RegisterUser>) -> Result<()> {
        ctx.accounts.init(&ctx.bumps)?;
        Ok(())
    }

    pub fn stake(ctx: Context<Stake>) -> Result<()> {
        ctx.accounts.stake(&ctx.bumps)?;

        Ok(())
    }
}
