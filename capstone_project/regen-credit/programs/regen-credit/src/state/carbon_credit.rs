use anchor_lang::prelude::*;

#[account]
pub struct CarbonCredit {
    pub country: Country,
    pub value: u32, //Max 4,294,967,295.
    pub units: EnergyUnits,
    pub source_type: SourceType,
    pub original_carbon_credits: u16,      //Max 65535
    pub remaining_carbon_credits: u16,     //Max 65535
    pub grid_emission_factor: u32,         //Max 4,294,967,295.
    pub grid_emission_factor_decimals: u8, //Max 255
    pub listed: bool,
    pub maker: Pubkey,
    pub price_per_carbon_credit: u16, //Max 65535
    pub bump: u8,
}
impl Space for CarbonCredit {
    const INIT_SPACE: usize = 8 + (1 + 4 + 1 + 1 + 2 + 2 + 4 + 1 + 1 + 32 + 2 + 1);
}
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub enum SourceType {
    Solar,
}
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub enum EnergyUnits {
    MWh,
    KWh,
}
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub enum Country {
    UnitedKingdom,
    SouthAfrica,
    China,
    HongKong,
    India,
    Indonesia,
    Japan,
    Korea,
    Thailand,
    Australia,
    NewZealand,
    SaudiArabia,
    Turkey,
    UnitedArabEmirates,
    Canada,
    Mexico,
    UnitedStates,
    Argentina,
    Brazil,
    Austria,
    Belgium,
    Bulgaria,
    Croatia,
    Cyprus,
    CzechRepublic,
    Denmark,
    Estonia,
    Finland,
    France,
    Germany,
    Greece,
    Hungary,
    Iceland,
    Ireland,
    Italy,
    Latvia,
    Lithuania,
    Luxembourg,
    Malta,
    Netherlands,
    Norway,
    Poland,
    Portugal,
    Romania,
    RussianFederation,
    Serbia,
    Slovakia,
    Slovenia,
    Spain,
    Sweden,
    Switzerland,
}
