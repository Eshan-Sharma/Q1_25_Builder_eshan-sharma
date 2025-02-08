use anchor_lang::prelude::*;
use anchor_spl::token::{Mint,Token};

use crate::state::StakeConfig;

#[derive(Accounts)]
pub struct InitializeConfig<'info>{
    #[account(mut)]
    pub admin:Signer<'info>,
    #[account(
        init, 
        payer=admin,
        space=StakeConfig::INIT_SPACE+8,
        seeds=[b"stake_config"],
        bump
    )]
    pub config:Account<'info, StakeConfig>,
    pub system_program:Program<'info, System>,

    #[account(
        init, 
        payer=admin,
        mint::authority=config,
        mint::decimals=6,
        seeds=[b"rewards",config.key().as_ref()],
        bump
    )]
    pub rewards_mint:Account<'info, Mint>,
    pub token_program:Program<'info,Token>
}

impl<'info> InitializeConfig<'info>{
    pub fn init(&mut self, bumps:InitializeConfigBumps, points_per_stake: u8, max_state: u8, freeze_period: u32,)->Result<()>{
        self.config.set_inner(StakeConfig {
             points_per_stake,
              max_state, 
              freeze_period, 
              rewards_bump: bumps.rewards_mint, 
              bump: bumps.config
             });
        Ok(())
    }
}