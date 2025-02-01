use crate::state::Marketplace;
use anchor_lang::prelude::*;
use anchor_spl::token_interface::{Mint, TokenInterface};

#[derive(Accounts)]
#[instruction(name:String)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub admin: Signer<'info>,
    #[account(
        init,
        space=Marketplace::INIT_SPACE,
        payer=admin,
        seeds=[b"marketplace",name.as_str().as_bytes()],
        bump
    )]
    pub marketplace: Account<'info, Marketplace>,
    #[account(
        seeds=[b"treasury",marketplace.key().as_ref()],
        bump
    )]
    pub treasury: SystemAccount<'info>,
    #[account(
        init,
        payer=admin,
        seeds=[b"rewards",marketplace.key().as_ref()],
        bump,
        mint::decimals=6,
        mint::authority=marketplace
    )]
    pub rewards_mint: InterfaceAccount<'info, Mint>,
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
}

impl<'info> Initialize<'info> {
    pub fn init(&mut self, fee: u16, bumps: &InitializeBumps, name: String) -> Result<()> {
        self.marketplace.set_inner(Marketplace {
            admin: self.admin.key(),
            fee,
            bump: bumps.marketplace,
            treasury_bump: bumps.treasury,
            rewards_mint_bump: bumps.rewards_mint,
            name,
        });
        Ok(())
    }
}
