#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;

declare_id!("coUnmi3oBUtwtd9fjeAvSsJssXh5A5xyPbhpewyzRVF");

#[program]
pub mod crudapp {
    use super::*;

    pub fn create_journal_entry(
        ctx: Context<CreateEntry>,
        title: String,
        message: String,
    ) -> Result<()> {
        let journal = &mut ctx.accounts.journal_entry;
        journal.owner = ctx.accounts.user.key();
        journal.title = title;
        journal.message = message;
        Ok(())
    }

    pub fn update_journal_entry(ctx: Context<UpdateEntry>,_title: String, message: String) -> Result<()> {
        let journal = &mut ctx.accounts.journal_entry;
        journal.message = message;
        Ok(())
    }

    pub fn delete_journal_entry(_ctx: Context<DeleteEntry>,_title: String) -> Result<()> {
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct CreateEntry<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
      init, 
      payer = user,
      space = 8 + JournalEntryState::INIT_SPACE,
      seeds = [user.key().as_ref(), title.as_bytes().as_ref()],
      bump
    )]
    pub journal_entry: Account<'info, JournalEntryState>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct JournalEntryState {
    pub owner: Pubkey,
    #[max_len(32)]
    pub title: String,
    #[max_len(1024)]
    pub message: String,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct UpdateEntry<'info> {
    #[account(mut)]
    pub user:Signer<'info>,
    #[account(
        mut,
        seeds = [user.key().as_ref(), title.as_bytes().as_ref()],
        bump,
        realloc = 8 + JournalEntryState::INIT_SPACE,
        realloc::payer = user,
        realloc::zero = false
      )]
    pub journal_entry: Account<'info, JournalEntryState>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(title: String)]
pub struct DeleteEntry<'info> {
    #[account(mut)]
    pub user:Signer<'info>,
    #[account(
        mut,
        seeds = [user.key().as_ref(), title.as_bytes().as_ref()],
        bump,
        close = user
      )]
    pub journal_entry: Account<'info, JournalEntryState>,
    pub system_program: Program<'info, System>,
}