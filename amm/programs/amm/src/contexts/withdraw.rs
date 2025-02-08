use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{burn, transfer, Burn, Mint, Token, TokenAccount, Transfer},
};
use constant_product_curve::ConstantProduct;

use crate::{errors::AmmError, state::Config};

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub lp_provider: Signer<'info>,
    pub mint_x: Account<'info, Mint>,
    pub mint_y: Account<'info, Mint>,
    #[account(
        has_one=mint_x,
        has_one=mint_y,
        seeds=[b"config",config.seed.to_le_bytes().as_ref()],
        bump=config.config_bump
    )]
    pub config: Account<'info, Config>,

    #[account(
        mut,
        seeds=[b"lp",config.key().as_ref()],
        bump=config.lp_bump,
    )]
    pub mint_lp: Account<'info, Config>,
    #[account(
        mut,
        associated_token::mint=mint_x,
        associated_token::authority=config
    )]
    pub vault_x: Account<'info, TokenAccount>,
    #[account(
        mut,
        associated_token::mint=mint_y,
        associated_token::authority=config
    )]
    pub vault_y: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer=lp_provider,
        associated_token::authority=lp_provider,
        associated_token::mint=mint_x
    )]
    pub lp_provider_mint_x_ata: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer=lp_provider,
        associated_token::authority=lp_provider,
        associated_token::mint=mint_y
    )]
    pub lp_provider_mint_y_ata: Account<'info, TokenAccount>,
    #[account(
        init_if_needed,
        payer=lp_provider,
        associated_token::authority=lp_provider,
        associated_token::mint=mint_lp
    )]
    pub lp_provider_mint_lp_ata: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> Withdraw<'info> {
    pub fn withdraw(&mut self, amount: u64, min_x: u64, min_y: u64) -> Result<()> {
        require!(self.config.locked == false, AmmError::PoolLocked);
        require!(amount != 0, AmmError::InvalidAmount);
        require!(min_x != 0 || min_y != 0, AmmError::InvalidAmount);
        let amounts = ConstantProduct::xy_deposit_amounts_from_l(
            self.vault_x.amount,
            self.vault_y.amount,
            self.lp_provider_mint_lp_ata.amount,
            amount,
            6,
        )
        .map_err(AmmError::from)?;
        require!(
            min_x <= amounts.x && min_y <= amounts.y,
            AmmError::SlippageExceeded
        );

        self.withdraw_token(true, min_x)?;
        self.withdraw_token(false, min_y)?;
        self.burn_lp_token(amount)?;
        Ok(())
    }

    fn withdraw_token(&self, is_x: bool, amount: u64) -> Result<()> {
        let (from, to) = match is_x {
            true => (
                self.lp_provider_mint_x_ata.to_account_info(),
                self.lp_provider_mint_y_ata.to_account_info(),
            ),
            false => (
                self.lp_provider_mint_y_ata.to_account_info(),
                self.lp_provider_mint_x_ata.to_account_info(),
            ),
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from,
            to,
            authority: self.config.to_account_info(),
        };
        let seeds = &[
            &b"config"[..],
            &self.config.seed.to_le_bytes(),
            &[self.config.config_bump],
        ];
        let signer_seeds = &[&seeds[..]];
        let ctx_cpi = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer_seeds);
        transfer(ctx_cpi, amount)?;
        Ok(())
    }
    fn burn_lp_token(&self, amount: u64) -> Result<()> {
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = Burn {
            mint: self.mint_lp.to_account_info(),
            from: self.lp_provider_mint_lp_ata.to_account_info(),
            authority: self.config.to_account_info(),
        };

        let ctx = CpiContext::new(cpi_program, cpi_accounts);
        burn(ctx, amount)?;
        Ok(())
    }
}
