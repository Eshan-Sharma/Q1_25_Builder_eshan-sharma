use anchor_lang::prelude::*;

declare_id!("GmokUsmPddXaPe4MdYnUYZnmSo6rs9koyUiNcdz5psAQ");
pub mod context;
pub mod errors;
pub mod helper;
pub mod state;

pub use context::*;
pub use state::*;

pub use helper::CardArgs;
pub use helper::Country;
pub use helper::EnergyUnits;
pub use helper::SourceType;

#[program]
pub mod regen_credit {

    use super::*;

    pub fn initialize_carbon_credit(
        ctx: Context<InitializeCarbonCredit>,
        country: Country,
        price_per_carbon_credit: u16,
        value: u32,
        units: EnergyUnits,
    ) -> Result<()> {
        ctx.accounts.init_carbon_credit(
            country,
            price_per_carbon_credit,
            value,
            units,
            &ctx.bumps,
        )?;
        Ok(())
    }

    pub fn initialize_marketplace(
        ctx: Context<InitializeMarketplace>,
        name: String,
        fee: u16,
    ) -> Result<()> {
        ctx.accounts.init_marketplace(name, &ctx.bumps, fee)
    }
    pub fn list(ctx: Context<List>) -> Result<()> {
        ctx.accounts.list()
    }
    pub fn reduce_remaining_credits(
        ctx: Context<ReduceCarbonCredits>,
        number_of_credits: u16,
    ) -> Result<()> {
        ctx.accounts.reduce_remaining_credits(number_of_credits)?;
        Ok(())
    }
    pub fn send_usdc(ctx: Context<SendUsdc>, number_of_credits: u16) -> Result<()> {
        ctx.accounts.send_usdc(number_of_credits)?;
        ctx.accounts.send_fee(number_of_credits)?;
        Ok(())
    }
    pub fn update_marketplace_fee(ctx: Context<UpdateMarketplaceFee>, fee: u16) -> Result<()> {
        ctx.accounts.update_marketplace_fee(fee)?;
        Ok(())
    }
    pub fn delist(ctx: Context<Delist>) -> Result<()> {
        ctx.accounts.delist()?;
        Ok(())
    }
    pub fn mint_nft(ctx: Context<MintNft>, args: CardArgs) -> Result<()> {
        ctx.accounts.mint_nft(args)?;
        Ok(())
    }
}
