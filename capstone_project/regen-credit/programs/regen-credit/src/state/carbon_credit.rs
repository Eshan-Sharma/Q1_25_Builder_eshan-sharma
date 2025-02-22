use anchor_lang::prelude::*;

pub use crate::helper::Country;
pub use crate::helper::EnergyUnits;
pub use crate::helper::SourceType;

#[account]
pub struct CarbonCredit {
    pub country: Country,
    pub source_type: SourceType,
    pub units: EnergyUnits,

    pub value: u32, //Max 4,294,967,295.

    pub original_carbon_credits: u16,  //Max 65535
    pub remaining_carbon_credits: u16, //Max 65535

    pub grid_emission_factor: u32,         //Max 4,294,967,295.
    pub grid_emission_factor_decimals: u8, //Max 255

    pub listed: bool,
    pub maker: Pubkey,
    pub price_per_carbon_credit: u16, //Max 65535
    pub bump: u8,
}
impl Space for CarbonCredit {
    const INIT_SPACE: usize = 8 + //Anchor Discriminator
    1 +  //Country Enum
    1 +  //SourceType Enum
    1 +  //EnergyUnits Enum
    4 +  //u32
    2 +  //u16
    2 +  //u16
    4 +  //u32
    1 +  //u8 
    1 +  //bool
    32 + //PubKey
    2 +  //u16
    1; //u8
}
