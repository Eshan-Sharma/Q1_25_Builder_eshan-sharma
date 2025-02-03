use anchor_lang::prelude::*;

use crate::{errors::AmmError, state::Config};
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, MintTo, Token, TokenAccount, Transfer}, token_2022::spl_token_2022::solana_zk_token_sdk::instruction::transfer,
};
use constant_product_curve::ConstantProduct;

#[derive(Accounts)]
pub struct Deposit<'info> {
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
        seeds=[b"lp",config.key().as_ref()],
        bump=config.lp_bump,
        mint::decimals=6,
        mint::authority=config
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
        associated_token::authority=lp_provider,
        associated_token::mint=mint_x
    )]
    pub lp_provider_mint_x_ata: Account<'info, TokenAccount>,
    #[account(
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

impl<'info> Deposit<'info>{
    pub fn deposit_token(&mut self,is_x:bool,amount:u64)->Result<()>{
        let (from,to)=match is_x {
            true=>(self.lp_provider_mint_x_ata.to_account_info(),self.vault_x.to_account_info()),
            false=>(self.lp_provider_mint_y_ata.to_account_info(),self.vault_y.to_account_info())
            
        };
        let cpi_program = self.token_program.to_account_info();
        let cpi_account:Transfer{
             from:se ,
     to,
     authority: self.lp_provider.to_account_info()
        }
let cpi_ctx=CpiContext::new(cpi_program,cpi_account);
transfer(cpi_ctx,amount)?;
        Ok(())
    }
}