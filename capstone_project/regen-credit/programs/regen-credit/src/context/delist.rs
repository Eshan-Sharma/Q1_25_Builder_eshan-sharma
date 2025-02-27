use crate::errors::ErrorCode;
use crate::CarbonCredit;
use anchor_lang::prelude::*;
#[derive(Accounts)]
pub struct Delist<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,
    #[account(
        mut,
        seeds = [b"carbon_credit".as_ref(), maker.key().as_ref()],
        bump = carbon_credit.bump
    )]
    pub carbon_credit: Account<'info, CarbonCredit>,
    pub system_program: Program<'info, System>,
}
impl<'info> Delist<'info> {
    pub fn delist(&mut self) -> Result<()> {
        require!(self.carbon_credit.listed, ErrorCode::NotListed);
        self.carbon_credit.listed = false;
        Ok(())
    }
}
