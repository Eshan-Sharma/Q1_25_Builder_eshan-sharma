use anchor_lang::prelude::*;

use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token_interface::{transfer_checked,TransferChecked,Mint,TokenAccount,TokenInterface};

use crate::state::Listing;
use crate::state::Marketplace;

#[derive(Accounts)]
pub struct Delist<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,
    #[account(
        seeds=[b"marketplace",marketplace.name.as_str().as_bytes()],
        bump=marketplace.bump
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
        mut,
        associated_token::mint=maker_mint,
        associated_token::authority=listing,
    )]
    pub vault:InterfaceAccount<'info,TokenAccount>,
    pub associated_token_program:Program<'info, AssociatedToken>,
    pub system_program:Program<'info, System>,
    pub token_program:Interface<'info, TokenInterface>,

    #[account(
        mut, 
        close=maker,
        seeds=[marketplace.key().as_ref(),maker_mint.key().as_ref()],
        bump=listing.bump
    )]
    pub listing:Account<'info, Listing>,
}

impl<'info> Delist<'info>{
    pub fn withdraw_nft(&mut self)->Result<()>{
        let seeds = &[
            &self.marketplace.key().to_bytes()[..],
            &self.maker_mint.key().to_bytes()[..],
            &[self.listing.bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let accounts = TransferChecked{
            from:self.vault.to_account_info(),
             mint:self.maker_mint.to_account_info(),
             to:self.maker_ata.to_account_info(),
             authority:self.listing.to_account_info()
        };

        let cpi_ctx = CpiContext::new_with_signer(self.token_program.to_account_info(), accounts, signer_seeds);
        transfer_checked(cpi_ctx, 1, self.maker_mint.decimals)?;
        Ok(())
    }
}