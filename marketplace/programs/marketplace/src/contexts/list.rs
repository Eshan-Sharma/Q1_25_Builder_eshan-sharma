use anchor_lang::prelude::*;

use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::Mint;
use anchor_spl::token_interface::TokenAccount;
use anchor_spl::token_interface::TokenInterface;
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
    pub token_program:Interface<'info, TokenInterface>

}
