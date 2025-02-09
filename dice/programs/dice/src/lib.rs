use anchor_lang::prelude::*;

declare_id!("7sQSfqt7sJ96D1zBK3GgPTj5hpWWMc5cJoGDpLPCtwbg");
pub mod context;
pub use context::*;
pub mod state;
#[program]
pub mod dice {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, amount: u64) -> Result<()> {
        ctx.accounts.init(amount)?;
        Ok(())
    }
    pub fn place_bet(ctx: Context<PlaceBet>, amount: u64, seed: u128, roll: u8) -> Result<()> {
        ctx.accounts.create_bet(seed, roll, &ctx.bumps, amount)?;
        ctx.accounts.deposit(amount)?;
        Ok(())
    }
    pub fn resolve_bet(ctx: Context<ResolveBets>, sig: Vec<u8>) -> Result<()> {
        ctx.accounts.verify_ed25519_signature(&sig)?;
        ctx.accounts.resolve_bets(&ctx.bumps, &sig)?;
        Ok(())
    }
}
