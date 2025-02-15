use anchor_lang::prelude::*;

declare_id!("BVHV15bav5SCp5DMnXPZ5qVHNFykmxhMQ3RsFaHEC9oU");
pub mod context;
pub mod state;
pub use context::*;
pub use state::*;
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
        ctx.accounts
            .init_carbon_credit(country, price_per_carbon_credit, value, units, &ctx.bumps)
    }
}
