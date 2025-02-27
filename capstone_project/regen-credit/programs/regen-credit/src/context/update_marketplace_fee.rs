use crate::errors::ErrorCode;
use crate::CarbonCredit;
use crate::Marketplace;
use anchor_lang::prelude::*;

#[derive(Accounts)]
pub struct UpdateMarketplaceFee<'info> {
    #[account(mut,address=carbon_credit.maker)]
    pub maker: SystemAccount<'info>,
    #[account(mut,address=marketplace.admin)]
    pub admin: Signer<'info>,
    #[account(
        mut,
        has_one = maker,
        seeds = [b"carbon_credit".as_ref(), carbon_credit.maker.key().as_ref()],
        bump
    )]
    pub carbon_credit: Account<'info, CarbonCredit>, // Carbon credit info (price, remaining supply)
    #[account(
        mut,
        seeds=[b"marketplace",marketplace.name.as_str().as_bytes()],
        bump
    )]
    pub marketplace: Account<'info, Marketplace>, // Marketplace fee structure
}
impl<'info> UpdateMarketplaceFee<'info> {
    pub fn update_marketplace_fee(&mut self, fee: u16) -> Result<()> {
        self.marketplace.fee = fee;
        Ok(())
    }
}
