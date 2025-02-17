use crate::errors::ErrorCode;
use crate::CarbonCredit;
use crate::Marketplace;
use anchor_lang::prelude::*;
use anchor_lang::solana_program::native_token::LAMPORTS_PER_SOL;
use anchor_lang::system_program::{transfer, Transfer};
use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};
use pyth_solana_receiver_sdk::price_update::{get_feed_id_from_hex, PriceUpdateV2};
#[derive(Accounts)]
pub struct PurchaseCarbonCredits<'info> {
    #[account(mut)]
    pub taker: Signer<'info>, //Sarah
    #[account(mut)]
    pub maker: SystemAccount<'info>, //Alex
    pub maker_mint: InterfaceAccount<'info, Mint>,
    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = maker_mint,
        associated_token::authority = taker,
    )]
    pub taker_ata: InterfaceAccount<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint = maker_mint,
        associated_token::authority = carbon_credit,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    #[account(
        seeds = [b"carbon_credit".as_ref(), carbon_credit.maker.key().as_ref()],
        bump
    )]
    pub carbon_credit: Account<'info, CarbonCredit>, // This is to read the carbon credit price, remaining carbon credits
    #[account(
        seeds=[b"marketplace",marketplace.name.as_str().as_bytes()],
        bump
    )]
    pub marketplace: Account<'info, Marketplace>, // This is to read the marketplace fee
    #[account(
        seeds=[b"treasury",marketplace.key().as_ref()],
        bump
    )]
    pub treasury: SystemAccount<'info>,

    pub price_update: Account<'info, PriceUpdateV2>, // This is for Oracle price feed
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub token_program: Interface<'info, TokenInterface>,
    pub system_program: Program<'info, System>,
}
impl<'info> PurchaseCarbonCredits<'info> {
    pub fn send_sol(&mut self, number_of_credits: u16) -> Result<()> {
        // Validate Purchase
        require!(
            self.carbon_credit.remaining_carbon_credits >= number_of_credits,
            ErrorCode::InsufficientCredits
        );
        // Calculate the total amount in USD
        let amount_usd = self
            .carbon_credit
            .price_per_carbon_credit
            .checked_mul(number_of_credits)
            .ok_or(ErrorCode::CalculationOverflow);
        // Get the current SOL price in USD
        let sol_price = self.get_sol_price_feed();

        let total_amount_lamports = u64::try_from(amount_usd.unwrap())
            .unwrap() //amount_usd
            .checked_div(sol_price)
            .ok_or(ErrorCode::CalculationOverflow)
            .unwrap()
            .checked_mul(LAMPORTS_PER_SOL)
            .ok_or(ErrorCode::CalculationOverflow)
            .unwrap();

        // Calculate Marketplace Fee (e.g., 2% Fee)
        let fee = (total_amount_lamports as u128)
            .checked_mul(self.marketplace.fee as u128)
            .ok_or(ErrorCode::CalculationOverflow)?
            .checked_div(100)
            .ok_or(ErrorCode::CalculationOverflow)? as u64;

        // Calculate Amount to Escrow (After Fee Deduction)
        let amount_to_escrow = total_amount_lamports
            .checked_sub(fee)
            .ok_or(ErrorCode::CalculationOverflow)?;
        // Transfer Fee to Treasury (Marketplace Owner)
        let fee_transfer = Transfer {
            from: self.taker.to_account_info(), //Sarah
            to: self.treasury.to_account_info(),
        };
        let fee_ctx = CpiContext::new(self.system_program.to_account_info(), fee_transfer);
        transfer(fee_ctx, fee)?;

        // Transfer Remaining Amount to Vault (Escrow)
        let escrow_transfer = Transfer {
            from: self.taker.to_account_info(), //Sarah
            to: self.vault.to_account_info(),
        };
        let escrow_ctx = CpiContext::new(self.system_program.to_account_info(), escrow_transfer);
        transfer(escrow_ctx, amount_to_escrow)?;

        // Update Remaining Carbon Credits
        self.carbon_credit.remaining_carbon_credits = self
            .carbon_credit
            .remaining_carbon_credits
            .checked_sub(number_of_credits)
            .ok_or(ErrorCode::CalculationOverflow)?;
        Ok(())
    }

    pub fn release_escrow(&mut self) -> Result<()> {
        // Release escrow to the maker (Alex) after NFT transfer is verified
        let escrow_release = Transfer {
            from: self.vault.to_account_info(),
            to: self.maker.to_account_info(),
        };
        let release_ctx = CpiContext::new(self.system_program.to_account_info(), escrow_release);
        transfer(release_ctx, self.vault.amount)?;

        Ok(())
    }

    fn get_sol_price_feed(&mut self) -> u64 {
        let price_update = &self.price_update;
        // No Price older than 30 seconds
        let maximum_age: u64 = 30;
        let sol_usd_feed = "0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d";

        let feed_id: [u8; 32] = get_feed_id_from_hex(&sol_usd_feed).unwrap();
        let price = price_update
            .get_price_no_older_than(&Clock::get().unwrap(), maximum_age, &feed_id)
            .unwrap();

        let display_price = u64::try_from(price.price).unwrap()
            / 10u64.pow(u32::try_from(-price.exponent).unwrap());

        msg!("The price is ({}) ", display_price);
        display_price
    }
}
