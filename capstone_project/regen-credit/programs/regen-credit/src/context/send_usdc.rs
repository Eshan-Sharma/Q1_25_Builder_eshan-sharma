use crate::errors::ErrorCode;
use crate::CarbonCredit;
use crate::Marketplace;
use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{transfer_checked, TransferChecked},
    token_interface::{Mint, TokenAccount, TokenInterface},
};

#[derive(Accounts)]
pub struct SendUsdc<'info> {
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
impl<'info> SendUsdc<'info> {
    pub fn price_and_fee(&mut self, amount: u16) -> Result<()> {
        // Calculate total USDC cost
        let total_usdc = self
            .carbon_credit
            .price_per_carbon_credit
            .checked_mul(amount)
            .ok_or(ErrorCode::CalculationOverflow)?;
        // Apply marketplace fee
        let fee = total_usdc
            .checked_mul(self.marketplace.fee)
            .ok_or(ErrorCode::CalculationOverflow)?
            .checked_div(100)
            .ok_or(ErrorCode::CalculationOverflow)?;
        let seller_amount = total_usdc
            .checked_sub(fee)
            .ok_or(ErrorCode::CalculationUnderflow)?;
        // Transfer Fee to Treasury (Marketplace Owner)
        let fee_transfer = TransferChecked {
            from: self.taker_usdc.to_account_info(),
            to: self.treasury.to_account_info(),
            mint: self.mint.to_account_info(),
            authority: self.taker.to_account_info(),
        };
        let fee_ctx = CpiContext::new(self.token_program.to_account_info(), fee_transfer);
        transfer_checked(fee_ctx, fee.try_into().unwrap(), self.mint.decimals)?; // u64 -> u128, self.mint.decimals)?;

        // Transfer USDC from taker to maker (purchase amount)
        let transfer = TransferChecked {
            from: self.taker_usdc.to_account_info(),
            to: self.maker_usdc.to_account_info(),
            mint: self.mint.to_account_info(),
            authority: self.taker.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(self.system_program.to_account_info(), transfer);
        transfer_checked(
            cpi_ctx,
            seller_amount.try_into().unwrap(),
            self.mint.decimals,
        )?;

        Ok(())
    }
}
