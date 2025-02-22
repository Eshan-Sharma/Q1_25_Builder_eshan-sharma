use anchor_lang::prelude::*;

#[account]
pub struct Marketplace {
    pub admin: Pubkey,
    pub fee: u16,
    pub bump: u8,
    pub treasury_bump: u8,
    pub name: String,
}

impl Space for Marketplace {
    const INIT_SPACE: usize = 8 + //Anchor Discriminator 
        32 + //PubKey
        2 + //u16
        1 + //u8
        1 + //u8
        (4 + 32); //String +  32 Byte limit
}
