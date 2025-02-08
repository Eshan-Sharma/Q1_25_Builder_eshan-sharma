use anchor_lang::prelude::*;
pub mod contexts;
pub use contexts::*;
pub mod errors;
pub mod state;
declare_id!("2TMjuyHhBXCHfJYsuSNRGCmzXVkWVFo5PCWUNcfmCyXT");

#[program]
pub mod amm {
    use super::*;

    pub fn init(
        ctx: Context<Initialize>,
        seed: u64,
        authority: Option<Pubkey>,
        fee: u16,
    ) -> Result<()> {
        ctx.accounts.init(seed, fee, authority, ctx.bumps)?;
        Ok(())
    }

    pub fn deposit(ctx: Context<Deposit>, amount: u64, max_x: u64, max_y: u64) -> Result<()> {
        ctx.accounts.deposit(amount, max_x, max_y)?;
        Ok(())
    }
    pub fn withdraw(ctx: Context<Withdraw>, amount: u64, min_x: u64, min_y: u64) -> Result<()> {
        ctx.accounts.withdraw(amount, min_x, min_y)
    }
}
