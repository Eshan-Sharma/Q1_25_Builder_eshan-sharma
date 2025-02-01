use anchor_lang::prelude::*;

use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::metadata::Metadata;
use anchor_spl::metadata::MetadataAccount;
use anchor_spl::metadata::MasterEditionAccount;
use anchor_spl::token_interface::Mint;
use anchor_spl::token_interface::TokenAccount;
use anchor_spl::token_interface::TokenInterface;
use crate::state::Listing;
use crate::state::Marketplace;

#[derive(Accounts)]
pub struct List<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,
    #[account(
        seeds=[b"marketplace",marketplace.name.as_str().as_ref()],
        bump
    )]
    pub marketplace: Account<'info, Marketplace>,
    pub maker_mint:InterfaceAccount<'info,Mint>,
    #[account(
        mut, 
        associated_token::mint=maker_mint,
        associated_token::authority=maker,
    )]
    pub maker_ata : InterfaceAccount<'info, TokenAccount>,
    #[account(
        init,
        payer=maker,
        associated_token::mint=maker_mint,
        associated_token::authority=maker,
    )]
    pub vault:InterfaceAccount<'info,TokenAccount>,
    pub associated_token_program:Program<'info, AssociatedToken>,
    pub system_program:Program<'info, System>,
    pub token_program:Interface<'info, TokenInterface>,

    #[account(
        init, 
        payer=maker,
        seeds=[marketplace.key().as_ref(),maker_mint.key().as_ref()],
        bump,
        space=Listing::INIT_SPACE
    )]
    pub listing:Account<'info, Listing>,
    pub collection_mint:InterfaceAccount<'info,Mint>,
    #[account(
        seeds=[b"metadata", metadata_program.key().as_ref(),maker_mint.key().as_ref()],
        seeds::program=metadata_program.key(),
        bump,
        constraint=metadata.collection.as_ref().unwrap().key.as_ref()==collection_mint.key().as_ref(),
        constraint=metadata.collection.as_ref().unwrap().verified==true
    )]
    pub metadata:Account<'info, MetadataAccount>,
    #[account(
        seeds=[b"metadata",metadata_program.key().as_ref(),maker_mint.key().as_ref(),b"edition"],
        seeds::program=metadata_program.key(),
        bump
    )]
    pub master_edition:Account<'info, MasterEditionAccount>,
    pub metadata_program:Program<'info, Metadata>
}
