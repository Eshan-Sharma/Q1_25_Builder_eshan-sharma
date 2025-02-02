use anchor_lang::prelude::*;
pub mod contexts;
pub use contexts::*;
pub mod state;
pub use state::*;
declare_id!("Cst1bMdLbmrAdYMdnCWmaJceDSnjuhNNw6JMVPwJe4uo");

#[program]
pub mod marketplace {

    use super::*;

    pub fn initialize(ctx: Context<Initialize>, name: String, fee: u16) -> Result<()> {
        ctx.accounts.init(fee, &ctx.bumps, name)?;
        Ok(())
    }

    pub fn listing(ctx: Context<List>, price: u64) -> Result<()> {
        ctx.accounts.create_listing(price, &ctx.bumps)?;
        ctx.accounts.deposit_nft()?;
        Ok(())
    }
    pub fn purchase(ctx: Context<Purchase>) -> Result<()> {
        ctx.accounts.send_sol()?;
        ctx.accounts.send_nft()?;
        ctx.accounts.close_mint_vault()?;
        Ok(())
    }

    pub fn delisting(ctx: Context<Delist>) -> Result<()> {
        ctx.accounts.withdraw_nft()?;
        Ok(())
    }
}
