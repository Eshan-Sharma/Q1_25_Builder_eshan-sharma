use anchor_lang::prelude::*;

#[account]
#[derive(InitSpace)]
pub struct Escrow {
    pub seed: u64, // This is a random string used to derive pda
    pub mint_a: Pubkey,
    pub mint_b: Pubkey,
    pub maker: Pubkey,
    pub receive_amount: u64,
    pub bump: u8,
}
