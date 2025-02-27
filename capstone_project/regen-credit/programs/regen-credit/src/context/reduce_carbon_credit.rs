use crate::errors::ErrorCode;
use crate::CarbonCredit;
use crate::Marketplace;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

#[derive(Accounts)]
pub struct ReduceCarbonCredits<'info> {
    #[account(mut)]
    pub taker: Signer<'info>, // Buyer - Sarah
    #[account(mut,address=carbon_credit.maker)]
    pub maker: SystemAccount<'info>, // Seller - Alex

    #[account(mut)]
    pub mint: InterfaceAccount<'info, Mint>, // USDC Mint

    #[account(
        mut,
        has_one = maker,
        seeds = [b"carbon_credit".as_ref(), carbon_credit.maker.key().as_ref()],
        bump
    )]
    pub carbon_credit: Account<'info, CarbonCredit>, // Carbon credit info (price, remaining supply)
    #[account(
        seeds=[b"marketplace",marketplace.name.as_str().as_bytes()],
        bump
    )]
    pub marketplace: Account<'info, Marketplace>, // Marketplace fee structure
    #[account(
        mut,
        seeds=[b"treasury",marketplace.key().as_ref()],
        bump
    )]
    pub treasury: SystemAccount<'info>, // Treasury to collect fees

    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = mint,
        associated_token::authority = taker
    )]
    pub taker_usdc: InterfaceAccount<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = mint,
        associated_token::authority = maker
    )]
    pub maker_usdc: InterfaceAccount<'info, TokenAccount>,

    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}
impl<'info> ReduceCarbonCredits<'info> {
    pub fn reduce_remaining_credits(&mut self, amount: u16) -> Result<()> {
        require!(self.carbon_credit.listed, ErrorCode::NotListed);
        //Ensure enough credits are available
        require!(
            self.carbon_credit.remaining_carbon_credits >= amount,
            ErrorCode::InsufficientCredits
        );
        if self.carbon_credit.remaining_carbon_credits == amount {
            self.carbon_credit.listed = false;
        }
        // Reduce carbon credits
        self.carbon_credit.remaining_carbon_credits = self
            .carbon_credit
            .remaining_carbon_credits
            .checked_sub(amount)
            .ok_or(ErrorCode::CalculationUnderflow)?;

        Ok(())
    }

    // pub fn mint_nft(&mut self) -> Result<()> {
    //     Ok(())
    // }
}
