use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};

declare_id!("8ANFpb4Jni1BkRGY5aZubDCRr2mUdkUeshYHtM9WqRVA");

pub const NATIVE_USDC_MINT: Pubkey = pubkey!("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
pub const USDC_DECIMALS: u8 = 6;

#[program]
pub mod timelock {
    use super::*;

    pub fn create_lock(ctx: Context<CreateLock>, lock_id: u64, amount: u64, unlock_at: i64) -> Result<()> {
        require!(amount > 0, TimeLockError::ZeroAmount);
        validate_usdc_mint(&ctx.accounts.mint)?;
        let created_at = Clock::get()?.unix_timestamp;
        require!(unlock_at > created_at, TimeLockError::InvalidUnlockTime);

        token::transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.key(),
                TransferChecked {
                    from: ctx.accounts.owner_token.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(),
                },
            ),
            amount,
            USDC_DECIMALS,
        )?;

        let lock = &mut ctx.accounts.lock;
        lock.owner = ctx.accounts.owner.key();
        lock.mint = ctx.accounts.mint.key();
        lock.vault = ctx.accounts.vault.key();
        lock.lock_id = lock_id;
        lock.amount = amount;
        lock.created_at = created_at;
        lock.unlock_at = unlock_at;
        lock.withdrawn_at = 0;
        lock.bump = ctx.bumps.lock;
        lock.withdrawn = false;
        emit!(LockCreated { lock: lock.key(), owner: lock.owner, amount, created_at, unlock_at });
        Ok(())
    }

    pub fn add_funds(ctx: Context<UseLock>, amount: u64) -> Result<()> {
        require!(amount > 0, TimeLockError::ZeroAmount);
        require!(!ctx.accounts.lock.withdrawn, TimeLockError::AlreadyWithdrawn);
        validate_usdc_mint(&ctx.accounts.mint)?;
        let next = ctx.accounts.lock.amount.checked_add(amount).ok_or(TimeLockError::ArithmeticOverflow)?;
        token::transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.key(),
                TransferChecked {
                    from: ctx.accounts.owner_token.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(),
                },
            ),
            amount,
            USDC_DECIMALS,
        )?;
        ctx.accounts.lock.amount = next;
        emit!(LockFunded { lock: ctx.accounts.lock.key(), owner: ctx.accounts.owner.key(), amount, locked_after: next });
        Ok(())
    }

    pub fn withdraw(ctx: Context<UseLock>) -> Result<()> {
        validate_usdc_mint(&ctx.accounts.mint)?;
        require!(!ctx.accounts.lock.withdrawn, TimeLockError::AlreadyWithdrawn);
        let now = Clock::get()?.unix_timestamp;
        require!(now >= ctx.accounts.lock.unlock_at, TimeLockError::StillLocked);
        let amount = ctx.accounts.lock.amount;
        require!(amount > 0, TimeLockError::ZeroAmount);
        require!(ctx.accounts.vault.amount >= amount, TimeLockError::VaultInsolvent);

        let lock_id = ctx.accounts.lock.lock_id.to_le_bytes();
        let bump = [ctx.accounts.lock.bump];
        let signer: &[&[u8]] = &[
            b"lock",
            ctx.accounts.owner.key.as_ref(),
            lock_id.as_ref(),
            bump.as_ref(),
        ];
        token::transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.key(),
                TransferChecked {
                    from: ctx.accounts.vault.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.owner_token.to_account_info(),
                    authority: ctx.accounts.lock.to_account_info(),
                },
                &[signer],
            ),
            amount,
            USDC_DECIMALS,
        )?;
        let lock = &mut ctx.accounts.lock;
        lock.amount = 0;
        lock.withdrawn = true;
        lock.withdrawn_at = now;
        emit!(LockWithdrawn { lock: lock.key(), owner: lock.owner, amount, withdrawn_at: now });
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(lock_id: u64)]
pub struct CreateLock<'info> {
    #[account(mut)] pub owner: Signer<'info>,
    #[account(constraint = mint.key() == NATIVE_USDC_MINT @ TimeLockError::WrongMint)]
    pub mint: Account<'info, Mint>,
    #[account(mut, token::mint = mint, token::authority = owner, token::token_program = token_program)]
    pub owner_token: Account<'info, TokenAccount>,
    #[account(
        init,
        payer = owner,
        space = 8 + TimeLock::INIT_SPACE,
        seeds = [b"lock", owner.key().as_ref(), &lock_id.to_le_bytes()],
        bump
    )]
    pub lock: Account<'info, TimeLock>,
    #[account(
        init,
        payer = owner,
        associated_token::mint = mint,
        associated_token::authority = lock,
        associated_token::token_program = token_program
    )]
    pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UseLock<'info> {
    #[account(mut)] pub owner: Signer<'info>,
    #[account(
        mut,
        has_one = owner @ TimeLockError::Unauthorized,
        has_one = mint @ TimeLockError::WrongMint,
        has_one = vault @ TimeLockError::WrongVault,
        seeds = [b"lock", owner.key().as_ref(), &lock.lock_id.to_le_bytes()],
        bump = lock.bump
    )]
    pub lock: Account<'info, TimeLock>,
    #[account(constraint = mint.key() == NATIVE_USDC_MINT @ TimeLockError::WrongMint)]
    pub mint: Account<'info, Mint>,
    #[account(mut, token::mint = mint, token::authority = owner, token::token_program = token_program)]
    pub owner_token: Account<'info, TokenAccount>,
    #[account(mut, token::mint = mint, token::authority = lock, token::token_program = token_program)]
    pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct TimeLock {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub vault: Pubkey,
    pub lock_id: u64,
    pub amount: u64,
    pub created_at: i64,
    pub unlock_at: i64,
    pub withdrawn_at: i64,
    pub bump: u8,
    pub withdrawn: bool,
}

fn validate_usdc_mint(mint: &Account<Mint>) -> Result<()> {
    require_keys_eq!(mint.key(), NATIVE_USDC_MINT, TimeLockError::WrongMint);
    require!(mint.decimals == USDC_DECIMALS, TimeLockError::WrongDecimals);
    Ok(())
}

#[event]
pub struct LockCreated { pub lock: Pubkey, pub owner: Pubkey, pub amount: u64, pub created_at: i64, pub unlock_at: i64 }
#[event]
pub struct LockFunded { pub lock: Pubkey, pub owner: Pubkey, pub amount: u64, pub locked_after: u64 }
#[event]
pub struct LockWithdrawn { pub lock: Pubkey, pub owner: Pubkey, pub amount: u64, pub withdrawn_at: i64 }

#[error_code]
pub enum TimeLockError {
    #[msg("Amount must be greater than zero")] ZeroAmount,
    #[msg("Only Circle-issued native Solana USDC is accepted")] WrongMint,
    #[msg("USDC must use six decimals")] WrongDecimals,
    #[msg("The signer does not own this lock")] Unauthorized,
    #[msg("The supplied vault is not the lock vault")] WrongVault,
    #[msg("Unlock time must be in the future")] InvalidUnlockTime,
    #[msg("This lock has not reached its unlock timestamp")] StillLocked,
    #[msg("This lock has already been withdrawn")] AlreadyWithdrawn,
    #[msg("Arithmetic overflow")] ArithmeticOverflow,
    #[msg("Vault assets cannot satisfy this withdrawal")] VaultInsolvent,
}

#[cfg(test)]
mod tests {
    #[test]
    fn timestamp_boundary_unlocks_at_exact_time() {
        fn unlocked(now: i64, unlock_at: i64) -> bool { now >= unlock_at }
        assert!(!unlocked(99, 100));
        assert!(unlocked(100, 100));
        assert!(unlocked(101, 100));
    }
}
