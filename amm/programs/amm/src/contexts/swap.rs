use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{transfer, Mint, Token, TokenAccount, Transfer},
};
use constant_product_curve::{ConstantProduct, LiquidityPair};

use crate::{errors::AmmError, state::Config};

#[derive(Accounts)]
pub struct Swap<'info> {
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

impl<'info> Swap<'info> {
    fn deposit_token(&mut self, is_x: bool, amount: u64) -> Result<()> {
        let (from, to) = match is_x {
            true => (
                self.lp_provider_mint_x_ata.to_account_info(),
                self.vault_x.to_account_info(),
            ),
            false => (
                self.lp_provider_mint_y_ata.to_account_info(),
                self.vault_y.to_account_info(),
            ),
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from,
            to,
            authority: self.lp_provider.to_account_info(),
        };
        let ctx_cpi = CpiContext::new(cpi_program, cpi_accounts);
        transfer(ctx_cpi, amount)?;
        Ok(())
    }
    fn withdraw_token(&mut self, is_x: bool, amount: u64) -> Result<()> {
        let (from, to) = match is_x {
            true => (
                self.vault_y.to_account_info(),
                self.lp_provider_mint_y_ata.to_account_info(),
            ),
            false => (
                self.vault_x.to_account_info(),
                self.lp_provider_mint_x_ata.to_account_info(),
            ),
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_accounts = Transfer {
            from,
            to,
            authority: self.lp_provider.to_account_info(),
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
}
