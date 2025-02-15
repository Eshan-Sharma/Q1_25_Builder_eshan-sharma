use anchor_lang::prelude::*;

#[account]
pub struct Marketplace {
    pub admin: Pubkey,
    pub fee: u16,
    pub bump: u8,
    pub treasury_bump: u8,
    pub name: String, //32 byte limit set
}

impl Space for Marketplace {
    const INIT_SPACE: usize = 8 + (32 + 2 + 1 + 1 + 1 + (4 + 32));
}
