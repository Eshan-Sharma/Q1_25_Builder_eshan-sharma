use crate::helper::CardArgs;
use crate::{
    errors::ErrorCode,
    state::{CarbonCredit, Marketplace},
};
use anchor_lang::prelude::*;
use mpl_core::{instructions::CreateV2CpiBuilder, ID as MPL_CORE_ID};

#[derive(Accounts)]
pub struct MintNft<'info> {
    #[account(mut)]
    pub taker: Signer<'info>, // Buyer - Sarah
    #[account(mut,address=carbon_credit.maker)]
    pub maker: Signer<'info>, // Seller - Alex
    #[account(
        mut,
        has_one = maker,
        seeds = [b"carbon_credit".as_ref(), carbon_credit.maker.key().as_ref()],
        bump = carbon_credit.bump
    )]
    pub carbon_credit: Account<'info, CarbonCredit>, // Carbon credit info (price, remaining supply)
    #[account(
        seeds=[b"marketplace",marketplace.name.as_str().as_bytes()],
        bump = marketplace.bump
    )]
    pub marketplace: Account<'info, Marketplace>, // Marketplace fee structure
    #[account(mut)]
    pub asset: Signer<'info>,

    #[account(address = MPL_CORE_ID)]
    /// CHECK: This is checked by the address constraint
    pub mpl_core_program: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

impl<'info> MintNft<'info> {
    pub fn mint_nft(&mut self, args: CardArgs) -> Result<()> {
        require_eq!(self.carbon_credit.listed, true, ErrorCode::NotListed);
        CreateV2CpiBuilder::new(&self.mpl_core_program.to_account_info())
            .asset(&self.asset.to_account_info())
            .authority(Some(&self.maker.to_account_info()))
            .payer(&self.taker.to_account_info())
            .owner(Some(&self.taker.to_account_info()))
            .system_program(&self.system_program.to_account_info())
            .name(args.name)
            .uri(args.uri);

        Ok(())
    }
}
