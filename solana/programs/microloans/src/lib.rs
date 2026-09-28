use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};

declare_id!("8ww548YRZoz7APttt2JvZhtn4JuZ5Uf2vNAbAWkL8aVi");

pub const NATIVE_USDC_MINT: Pubkey = pubkey!("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
pub const USDC_DECIMALS: u8 = 6;
pub const BASIS_POINTS: u64 = 10_000;
pub const SECONDS_PER_DAY: i64 = 86_400;

#[program]
pub mod microloans {
    use super::*;

    #[allow(clippy::too_many_arguments)]
    pub fn create_policy(
        ctx: Context<CreatePolicy>,
        policy_id: u64,
        version: u32,
        min_score: u16,
        min_history_days: u16,
        initial_limit: u64,
        limit_step: u64,
        maximum_limit: u64,
        fee_bps: u16,
        term_seconds: i64,
        grace_seconds: i64,
        max_concurrent_loans: u8,
        reputation_exposure_cap: u64,
        secured_collateral_bps: u16,
        cooldown_seconds: i64,
    ) -> Result<()> {
        validate_usdc_mint(&ctx.accounts.mint)?;
        require!(version > 0, LoanError::InvalidPolicy);
        require!(initial_limit > 0 && initial_limit <= maximum_limit, LoanError::InvalidPolicy);
        require!(fee_bps as u64 <= BASIS_POINTS, LoanError::InvalidPolicy);
        require!(term_seconds > 0 && grace_seconds >= 0 && cooldown_seconds >= 0, LoanError::InvalidPolicy);
        require!(max_concurrent_loans > 0, LoanError::InvalidPolicy);
        require!(secured_collateral_bps as u64 >= BASIS_POINTS, LoanError::InvalidPolicy);
        let policy = &mut ctx.accounts.policy;
        policy.authority = ctx.accounts.authority.key();
        policy.score_authority = ctx.accounts.score_authority.key();
        policy.mint = ctx.accounts.mint.key();
        policy.treasury_vault = ctx.accounts.treasury_vault.key();
        policy.policy_id = policy_id;
        policy.version = version;
        policy.min_score = min_score;
        policy.min_history_days = min_history_days;
        policy.initial_limit = initial_limit;
        policy.limit_step = limit_step;
        policy.maximum_limit = maximum_limit;
        policy.fee_bps = fee_bps;
        policy.term_seconds = term_seconds;
        policy.grace_seconds = grace_seconds;
        policy.max_concurrent_loans = max_concurrent_loans;
        policy.reputation_exposure_cap = reputation_exposure_cap;
        policy.active_reputation_exposure = 0;
        policy.secured_collateral_bps = secured_collateral_bps;
        policy.cooldown_seconds = cooldown_seconds;
        policy.paused = true;
        policy.bump = ctx.bumps.policy;
        emit!(PolicyCreated { policy: policy.key(), policy_id, version });
        Ok(())
    }

    pub fn set_policy_pause(ctx: Context<ManagePolicy>, paused: bool) -> Result<()> {
        ctx.accounts.policy.paused = paused;
        Ok(())
    }

    pub fn create_profile(ctx: Context<CreateProfile>) -> Result<()> {
        let profile = &mut ctx.accounts.profile;
        profile.policy = ctx.accounts.policy.key();
        profile.borrower = ctx.accounts.borrower.key();
        profile.score_version = 0;
        profile.score = 0;
        profile.activity_started_at = 0;
        profile.evidence_hash = [0; 32];
        profile.score_updated_slot = 0;
        profile.score_expires_at = 0;
        profile.completed_loans = 0;
        profile.defaulted_loans = 0;
        profile.active_loans = 0;
        profile.outstanding_debt = 0;
        profile.cooldown_until = 0;
        profile.next_loan_id = 0;
        profile.bump = ctx.bumps.profile;
        Ok(())
    }

    pub fn attest_score(
        ctx: Context<AttestScore>,
        score_version: u32,
        score: u16,
        activity_started_at: i64,
        evidence_hash: [u8; 32],
        expires_at: i64,
    ) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        require!(score <= 1_000, LoanError::InvalidScore);
        require!(activity_started_at > 0 && activity_started_at <= now, LoanError::InvalidHistory);
        require!(expires_at > now, LoanError::InvalidScoreExpiry);
        require!(score_version > ctx.accounts.profile.score_version, LoanError::StaleScoreVersion);
        let profile = &mut ctx.accounts.profile;
        profile.score_version = score_version;
        profile.score = score;
        profile.activity_started_at = activity_started_at;
        profile.evidence_hash = evidence_hash;
        profile.score_updated_slot = Clock::get()?.slot;
        profile.score_expires_at = expires_at;
        emit!(ScoreAttested { policy: ctx.accounts.policy.key(), borrower: profile.borrower, score, score_version, evidence_hash });
        Ok(())
    }

    pub fn fund_lending_treasury(ctx: Context<FundTreasury>, amount: u64) -> Result<()> {
        require!(amount > 0, LoanError::ZeroAmount);
        validate_usdc_mint(&ctx.accounts.mint)?;
        token::transfer_checked(CpiContext::new(
            ctx.accounts.token_program.key(),
            TransferChecked {
                from: ctx.accounts.funder_token.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.treasury_vault.to_account_info(),
                authority: ctx.accounts.funder.to_account_info(),
            },
        ), amount, USDC_DECIMALS)?;
        emit!(TreasuryFunded { policy: ctx.accounts.policy.key(), funder: ctx.accounts.funder.key(), amount });
        Ok(())
    }

    pub fn borrow_reputation(ctx: Context<BorrowReputation>, loan_id: u64, amount: u64) -> Result<()> {
        require!(amount > 0, LoanError::ZeroAmount);
        validate_eligibility(&ctx.accounts.policy, &ctx.accounts.profile, loan_id, amount)?;
        let exposure_after = ctx.accounts.policy.active_reputation_exposure.checked_add(amount).ok_or(LoanError::ArithmeticOverflow)?;
        require!(exposure_after <= ctx.accounts.policy.reputation_exposure_cap, LoanError::ExposureCapExceeded);
        require!(ctx.accounts.treasury_vault.amount >= amount, LoanError::InsufficientTreasuryLiquidity);
        let now = Clock::get()?.unix_timestamp;
        let fee = calculate_fee(amount, ctx.accounts.policy.fee_bps)?;
        initialize_loan(
            &mut ctx.accounts.loan,
            &ctx.accounts.policy,
            &ctx.accounts.profile,
            ctx.accounts.borrower.key(),
            loan_id,
            LoanType::Reputation,
            amount,
            fee,
            0,
            Pubkey::default(),
            now,
            ctx.bumps.loan,
        )?;
        transfer_from_treasury(&ctx.accounts.policy, &ctx.accounts.treasury_vault, &ctx.accounts.mint, &ctx.accounts.borrower_token, &ctx.accounts.token_program, amount)?;
        let profile = &mut ctx.accounts.profile;
        profile.active_loans = profile.active_loans.checked_add(1).ok_or(LoanError::ArithmeticOverflow)?;
        profile.outstanding_debt = profile.outstanding_debt.checked_add(amount.checked_add(fee).ok_or(LoanError::ArithmeticOverflow)?).ok_or(LoanError::ArithmeticOverflow)?;
        profile.next_loan_id = profile.next_loan_id.checked_add(1).ok_or(LoanError::ArithmeticOverflow)?;
        ctx.accounts.policy.active_reputation_exposure = exposure_after;
        emit!(LoanDisbursed { policy: ctx.accounts.policy.key(), loan: ctx.accounts.loan.key(), borrower: ctx.accounts.borrower.key(), loan_type: LoanType::Reputation, principal: amount, fee, due_at: ctx.accounts.loan.due_at });
        Ok(())
    }

    pub fn borrow_secured(ctx: Context<BorrowSecured>, loan_id: u64, amount: u64, collateral_amount: u64) -> Result<()> {
        require!(amount > 0 && collateral_amount > 0, LoanError::ZeroAmount);
        require!(!ctx.accounts.policy.paused, LoanError::PolicyPaused);
        require!(loan_id == ctx.accounts.profile.next_loan_id, LoanError::WrongLoanId);
        require!(ctx.accounts.profile.active_loans < ctx.accounts.policy.max_concurrent_loans, LoanError::TooManyActiveLoans);
        require!(Clock::get()?.unix_timestamp >= ctx.accounts.profile.cooldown_until, LoanError::CooldownActive);
        let required = required_collateral(amount, ctx.accounts.policy.secured_collateral_bps)?;
        require!(collateral_amount >= required, LoanError::InsufficientCollateral);
        require!(amount <= ctx.accounts.policy.maximum_limit, LoanError::LoanLimitExceeded);
        require!(ctx.accounts.treasury_vault.amount >= amount, LoanError::InsufficientTreasuryLiquidity);
        validate_usdc_mint(&ctx.accounts.mint)?;
        token::transfer_checked(CpiContext::new(
            ctx.accounts.token_program.key(),
            TransferChecked {
                from: ctx.accounts.borrower_token.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.collateral_vault.to_account_info(),
                authority: ctx.accounts.borrower.to_account_info(),
            },
        ), collateral_amount, USDC_DECIMALS)?;
        let now = Clock::get()?.unix_timestamp;
        let fee = calculate_fee(amount, ctx.accounts.policy.fee_bps)?;
        initialize_loan(&mut ctx.accounts.loan, &ctx.accounts.policy, &ctx.accounts.profile, ctx.accounts.borrower.key(), loan_id, LoanType::Secured, amount, fee, collateral_amount, ctx.accounts.collateral_vault.key(), now, ctx.bumps.loan)?;
        transfer_from_treasury(&ctx.accounts.policy, &ctx.accounts.treasury_vault, &ctx.accounts.mint, &ctx.accounts.borrower_token, &ctx.accounts.token_program, amount)?;
        let profile = &mut ctx.accounts.profile;
        profile.active_loans = profile.active_loans.checked_add(1).ok_or(LoanError::ArithmeticOverflow)?;
        profile.outstanding_debt = profile.outstanding_debt.checked_add(amount.checked_add(fee).ok_or(LoanError::ArithmeticOverflow)?).ok_or(LoanError::ArithmeticOverflow)?;
        profile.next_loan_id = profile.next_loan_id.checked_add(1).ok_or(LoanError::ArithmeticOverflow)?;
        emit!(LoanDisbursed { policy: ctx.accounts.policy.key(), loan: ctx.accounts.loan.key(), borrower: ctx.accounts.borrower.key(), loan_type: LoanType::Secured, principal: amount, fee, due_at: ctx.accounts.loan.due_at });
        Ok(())
    }

    pub fn repay(ctx: Context<Repay>, amount: u64) -> Result<()> {
        require!(amount > 0, LoanError::ZeroAmount);
        require!(matches!(ctx.accounts.loan.state, LoanState::Active | LoanState::PartiallyRepaid | LoanState::Overdue), LoanError::InvalidLoanState);
        require!(amount <= ctx.accounts.loan.outstanding, LoanError::RepaymentTooLarge);
        validate_usdc_mint(&ctx.accounts.mint)?;
        token::transfer_checked(CpiContext::new(
            ctx.accounts.token_program.key(),
            TransferChecked {
                from: ctx.accounts.borrower_token.to_account_info(),
                mint: ctx.accounts.mint.to_account_info(),
                to: ctx.accounts.treasury_vault.to_account_info(),
                authority: ctx.accounts.borrower.to_account_info(),
            },
        ), amount, USDC_DECIMALS)?;
        let outstanding_after = ctx.accounts.loan.outstanding.checked_sub(amount).ok_or(LoanError::ArithmeticOverflow)?;
        // Repay principal before fee for exposure accounting. This makes the
        // reputation exposure cap track actual principal still at risk.
        let principal_repaid = amount.min(ctx.accounts.loan.principal_outstanding);
        ctx.accounts.loan.principal_outstanding = ctx.accounts.loan.principal_outstanding.checked_sub(principal_repaid).ok_or(LoanError::ArithmeticOverflow)?;
        ctx.accounts.loan.repaid = ctx.accounts.loan.repaid.checked_add(amount).ok_or(LoanError::ArithmeticOverflow)?;
        ctx.accounts.loan.outstanding = outstanding_after;
        ctx.accounts.profile.outstanding_debt = ctx.accounts.profile.outstanding_debt.checked_sub(amount).ok_or(LoanError::ArithmeticOverflow)?;
        if ctx.accounts.loan.loan_type == LoanType::Reputation && principal_repaid > 0 {
            ctx.accounts.policy.active_reputation_exposure = ctx.accounts.policy.active_reputation_exposure.checked_sub(principal_repaid).ok_or(LoanError::ArithmeticOverflow)?;
        }
        if outstanding_after == 0 {
            ctx.accounts.loan.state = LoanState::Repaid;
            ctx.accounts.loan.closed_at = Clock::get()?.unix_timestamp;
            ctx.accounts.profile.active_loans = ctx.accounts.profile.active_loans.checked_sub(1).ok_or(LoanError::ArithmeticOverflow)?;
            ctx.accounts.profile.completed_loans = ctx.accounts.profile.completed_loans.checked_add(1).ok_or(LoanError::ArithmeticOverflow)?;
            ctx.accounts.profile.cooldown_until = ctx.accounts.loan.closed_at.checked_add(ctx.accounts.policy.cooldown_seconds).ok_or(LoanError::ArithmeticOverflow)?;

        } else {
            ctx.accounts.loan.state = LoanState::PartiallyRepaid;
        }
        emit!(LoanRepaid { policy: ctx.accounts.policy.key(), loan: ctx.accounts.loan.key(), borrower: ctx.accounts.borrower.key(), amount, outstanding_after, fully_repaid: outstanding_after == 0 });
        Ok(())
    }

    pub fn release_repaid_collateral(ctx: Context<ReleaseRepaidCollateral>) -> Result<()> {
        require!(ctx.accounts.loan.loan_type == LoanType::Secured, LoanError::NotSecuredLoan);
        require!(ctx.accounts.loan.state == LoanState::Repaid, LoanError::InvalidLoanState);
        require!(!ctx.accounts.loan.collateral_released, LoanError::CollateralAlreadyReleased);
        require!(!ctx.accounts.loan.collateral_liquidated, LoanError::AlreadyLiquidated);
        validate_usdc_mint(&ctx.accounts.mint)?;
        let collateral = ctx.accounts.loan.collateral_amount;
        require!(ctx.accounts.collateral_vault.amount >= collateral, LoanError::CollateralVaultInsolvent);
        transfer_from_loan(&ctx.accounts.loan, &ctx.accounts.collateral_vault, &ctx.accounts.mint, &ctx.accounts.borrower_token, &ctx.accounts.token_program, collateral)?;
        ctx.accounts.loan.collateral_released = true;
        emit!(CollateralReleased { policy: ctx.accounts.policy.key(), loan: ctx.accounts.loan.key(), borrower: ctx.accounts.borrower.key(), amount: collateral });
        Ok(())
    }

    pub fn mark_overdue(ctx: Context<UpdateDelinquency>) -> Result<()> {
        require!(matches!(ctx.accounts.loan.state, LoanState::Active | LoanState::PartiallyRepaid), LoanError::InvalidLoanState);
        require!(Clock::get()?.unix_timestamp > ctx.accounts.loan.due_at, LoanError::NotOverdue);
        ctx.accounts.loan.state = LoanState::Overdue;
        emit!(LoanOverdue { policy: ctx.accounts.policy.key(), loan: ctx.accounts.loan.key(), borrower: ctx.accounts.loan.borrower });
        Ok(())
    }

    pub fn mark_defaulted(ctx: Context<UpdateDelinquency>) -> Result<()> {
        require!(ctx.accounts.loan.state == LoanState::Overdue, LoanError::InvalidLoanState);
        let default_at = ctx.accounts.loan.due_at.checked_add(ctx.accounts.policy.grace_seconds).ok_or(LoanError::ArithmeticOverflow)?;
        require!(Clock::get()?.unix_timestamp > default_at, LoanError::GracePeriodActive);
        ctx.accounts.loan.state = LoanState::Defaulted;
        ctx.accounts.profile.defaulted_loans = ctx.accounts.profile.defaulted_loans.checked_add(1).ok_or(LoanError::ArithmeticOverflow)?;
        emit!(LoanDefaulted { policy: ctx.accounts.policy.key(), loan: ctx.accounts.loan.key(), borrower: ctx.accounts.loan.borrower, outstanding: ctx.accounts.loan.outstanding });
        Ok(())
    }

    pub fn close_defaulted_reputation(ctx: Context<CloseDefaultedReputation>) -> Result<()> {
        require!(ctx.accounts.loan.loan_type == LoanType::Reputation, LoanError::NotReputationLoan);
        require!(ctx.accounts.loan.state == LoanState::Defaulted, LoanError::InvalidLoanState);
        let written_off = ctx.accounts.loan.outstanding;
        let principal_written_off = ctx.accounts.loan.principal_outstanding;
        ctx.accounts.profile.outstanding_debt = ctx.accounts.profile.outstanding_debt.checked_sub(written_off).ok_or(LoanError::ArithmeticOverflow)?;
        ctx.accounts.profile.active_loans = ctx.accounts.profile.active_loans.checked_sub(1).ok_or(LoanError::ArithmeticOverflow)?;
        ctx.accounts.policy.active_reputation_exposure = ctx.accounts.policy.active_reputation_exposure.checked_sub(principal_written_off).ok_or(LoanError::ArithmeticOverflow)?;
        ctx.accounts.loan.principal_outstanding = 0;
        ctx.accounts.loan.state = LoanState::Closed;
        ctx.accounts.loan.closed_at = Clock::get()?.unix_timestamp;
        emit!(ReputationLoanWrittenOff { policy: ctx.accounts.policy.key(), loan: ctx.accounts.loan.key(), borrower: ctx.accounts.loan.borrower, amount: written_off, principal_exposure_released: principal_written_off });
        Ok(())
    }

    pub fn liquidate_secured(ctx: Context<LiquidateSecured>) -> Result<()> {
        require!(ctx.accounts.loan.loan_type == LoanType::Secured, LoanError::NotSecuredLoan);
        require!(ctx.accounts.loan.state == LoanState::Defaulted, LoanError::InvalidLoanState);
        require!(!ctx.accounts.loan.collateral_liquidated, LoanError::AlreadyLiquidated);
        validate_usdc_mint(&ctx.accounts.mint)?;
        let collateral = ctx.accounts.loan.collateral_amount;
        require!(ctx.accounts.collateral_vault.amount >= collateral, LoanError::CollateralVaultInsolvent);
        let (applied, surplus) = collateral_settlement(collateral, ctx.accounts.loan.outstanding);
        if applied > 0 {
            transfer_from_loan(&ctx.accounts.loan, &ctx.accounts.collateral_vault, &ctx.accounts.mint, &ctx.accounts.treasury_vault, &ctx.accounts.token_program, applied)?;
        }
        if surplus > 0 {
            transfer_from_loan(&ctx.accounts.loan, &ctx.accounts.collateral_vault, &ctx.accounts.mint, &ctx.accounts.borrower_token, &ctx.accounts.token_program, surplus)?;
        }
        ctx.accounts.loan.outstanding = ctx.accounts.loan.outstanding.checked_sub(applied).ok_or(LoanError::ArithmeticOverflow)?;
        ctx.accounts.profile.outstanding_debt = ctx.accounts.profile.outstanding_debt.checked_sub(applied).ok_or(LoanError::ArithmeticOverflow)?;
        ctx.accounts.profile.active_loans = ctx.accounts.profile.active_loans.checked_sub(1).ok_or(LoanError::ArithmeticOverflow)?;
        ctx.accounts.loan.collateral_liquidated = true;
        ctx.accounts.loan.state = LoanState::Liquidated;
        ctx.accounts.loan.closed_at = Clock::get()?.unix_timestamp;
        emit!(CollateralLiquidated { policy: ctx.accounts.policy.key(), loan: ctx.accounts.loan.key(), borrower: ctx.accounts.loan.borrower, collateral, applied_to_debt: applied, surplus_returned: surplus, debt_remaining: ctx.accounts.loan.outstanding });
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(policy_id: u64)]
pub struct CreatePolicy<'info> {
    #[account(mut)] pub authority: Signer<'info>,
    /// CHECK: May attest versioned score evidence but cannot move treasury funds.
    pub score_authority: UncheckedAccount<'info>,
    #[account(constraint = mint.key() == NATIVE_USDC_MINT @ LoanError::WrongMint)] pub mint: Account<'info, Mint>,
    #[account(init, payer = authority, space = 8 + LendingPolicy::INIT_SPACE, seeds = [b"policy", authority.key().as_ref(), &policy_id.to_le_bytes()], bump)] pub policy: Account<'info, LendingPolicy>,
    #[account(init, payer = authority, associated_token::mint = mint, associated_token::authority = policy, associated_token::token_program = token_program)] pub treasury_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ManagePolicy<'info> { pub authority: Signer<'info>, #[account(mut, has_one = authority @ LoanError::Unauthorized)] pub policy: Account<'info, LendingPolicy> }

#[derive(Accounts)]
pub struct CreateProfile<'info> {
    #[account(mut)] pub borrower: Signer<'info>,
    pub policy: Account<'info, LendingPolicy>,
    #[account(init, payer = borrower, space = 8 + BorrowerProfile::INIT_SPACE, seeds = [b"profile", policy.key().as_ref(), borrower.key().as_ref()], bump)] pub profile: Account<'info, BorrowerProfile>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct AttestScore<'info> {
    pub score_authority: Signer<'info>,
    #[account(has_one = score_authority @ LoanError::Unauthorized)] pub policy: Account<'info, LendingPolicy>,
    #[account(mut, has_one = policy @ LoanError::WrongPolicy)] pub profile: Account<'info, BorrowerProfile>,
}

#[derive(Accounts)]
pub struct FundTreasury<'info> {
    #[account(mut)] pub funder: Signer<'info>,
    #[account(has_one = mint @ LoanError::WrongMint, has_one = treasury_vault @ LoanError::WrongTreasury)] pub policy: Account<'info, LendingPolicy>,
    #[account(constraint = mint.key() == NATIVE_USDC_MINT @ LoanError::WrongMint)] pub mint: Account<'info, Mint>,
    #[account(mut, token::mint = mint, token::authority = funder)] pub funder_token: Account<'info, TokenAccount>,
    #[account(mut, token::mint = mint, token::authority = policy)] pub treasury_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(loan_id: u64)]
pub struct BorrowReputation<'info> {
    #[account(mut)] pub borrower: Signer<'info>,
    #[account(mut, has_one = mint @ LoanError::WrongMint, has_one = treasury_vault @ LoanError::WrongTreasury)] pub policy: Account<'info, LendingPolicy>,
    #[account(mut, has_one = policy @ LoanError::WrongPolicy, has_one = borrower @ LoanError::Unauthorized)] pub profile: Account<'info, BorrowerProfile>,
    #[account(init, payer = borrower, space = 8 + Loan::INIT_SPACE, seeds = [b"loan", policy.key().as_ref(), borrower.key().as_ref(), &loan_id.to_le_bytes()], bump)] pub loan: Account<'info, Loan>,
    #[account(constraint = mint.key() == NATIVE_USDC_MINT @ LoanError::WrongMint)] pub mint: Account<'info, Mint>,
    #[account(mut, token::mint = mint, token::authority = policy)] pub treasury_vault: Account<'info, TokenAccount>,
    #[account(mut, token::mint = mint, token::authority = borrower)] pub borrower_token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(loan_id: u64)]
pub struct BorrowSecured<'info> {
    #[account(mut)] pub borrower: Signer<'info>,
    #[account(has_one = mint @ LoanError::WrongMint, has_one = treasury_vault @ LoanError::WrongTreasury)] pub policy: Account<'info, LendingPolicy>,
    #[account(mut, has_one = policy @ LoanError::WrongPolicy, has_one = borrower @ LoanError::Unauthorized)] pub profile: Account<'info, BorrowerProfile>,
    #[account(init, payer = borrower, space = 8 + Loan::INIT_SPACE, seeds = [b"loan", policy.key().as_ref(), borrower.key().as_ref(), &loan_id.to_le_bytes()], bump)] pub loan: Account<'info, Loan>,
    #[account(init, payer = borrower, token::mint = mint, token::authority = loan, token::token_program = token_program, seeds = [b"collateral", loan.key().as_ref()], bump)] pub collateral_vault: Account<'info, TokenAccount>,
    #[account(constraint = mint.key() == NATIVE_USDC_MINT @ LoanError::WrongMint)] pub mint: Account<'info, Mint>,
    #[account(mut, token::mint = mint, token::authority = policy)] pub treasury_vault: Account<'info, TokenAccount>,
    #[account(mut, token::mint = mint, token::authority = borrower)] pub borrower_token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Repay<'info> {
    #[account(mut)] pub borrower: Signer<'info>,
    #[account(mut, has_one = mint @ LoanError::WrongMint, has_one = treasury_vault @ LoanError::WrongTreasury)] pub policy: Account<'info, LendingPolicy>,
    #[account(mut, has_one = policy @ LoanError::WrongPolicy, has_one = borrower @ LoanError::Unauthorized)] pub profile: Account<'info, BorrowerProfile>,
    #[account(mut, has_one = policy @ LoanError::WrongPolicy, has_one = borrower @ LoanError::Unauthorized)] pub loan: Account<'info, Loan>,
    #[account(constraint = mint.key() == NATIVE_USDC_MINT @ LoanError::WrongMint)] pub mint: Account<'info, Mint>,
    #[account(mut, token::mint = mint, token::authority = policy)] pub treasury_vault: Account<'info, TokenAccount>,
    #[account(mut, token::mint = mint, token::authority = borrower)] pub borrower_token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ReleaseRepaidCollateral<'info> {
    #[account(mut)] pub borrower: Signer<'info>,
    #[account(has_one = mint @ LoanError::WrongMint)] pub policy: Account<'info, LendingPolicy>,
    #[account(mut, has_one = policy @ LoanError::WrongPolicy, has_one = borrower @ LoanError::Unauthorized, has_one = collateral_vault @ LoanError::WrongCollateralVault)] pub loan: Account<'info, Loan>,
    #[account(constraint = mint.key() == NATIVE_USDC_MINT @ LoanError::WrongMint)] pub mint: Account<'info, Mint>,
    #[account(mut, token::mint = mint, token::authority = loan)] pub collateral_vault: Account<'info, TokenAccount>,
    #[account(mut, token::mint = mint, token::authority = borrower)] pub borrower_token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct UpdateDelinquency<'info> {
    pub caller: Signer<'info>,
    pub policy: Account<'info, LendingPolicy>,
    #[account(mut, has_one = policy @ LoanError::WrongPolicy)] pub profile: Account<'info, BorrowerProfile>,
    #[account(mut, has_one = policy @ LoanError::WrongPolicy, constraint = loan.borrower == profile.borrower @ LoanError::BorrowerSubstitution)] pub loan: Account<'info, Loan>,
}

#[derive(Accounts)]
pub struct CloseDefaultedReputation<'info> {
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority @ LoanError::Unauthorized)] pub policy: Account<'info, LendingPolicy>,
    #[account(mut, has_one = policy @ LoanError::WrongPolicy)] pub profile: Account<'info, BorrowerProfile>,
    #[account(mut, has_one = policy @ LoanError::WrongPolicy, constraint = loan.borrower == profile.borrower @ LoanError::BorrowerSubstitution)] pub loan: Account<'info, Loan>,
}

#[derive(Accounts)]
pub struct LiquidateSecured<'info> {
    pub caller: Signer<'info>,
    #[account(has_one = mint @ LoanError::WrongMint, has_one = treasury_vault @ LoanError::WrongTreasury)] pub policy: Account<'info, LendingPolicy>,
    #[account(mut, has_one = policy @ LoanError::WrongPolicy)] pub profile: Account<'info, BorrowerProfile>,
    #[account(mut, has_one = policy @ LoanError::WrongPolicy, has_one = collateral_vault @ LoanError::WrongCollateralVault, constraint = loan.borrower == profile.borrower @ LoanError::BorrowerSubstitution)] pub loan: Account<'info, Loan>,
    #[account(constraint = mint.key() == NATIVE_USDC_MINT @ LoanError::WrongMint)] pub mint: Account<'info, Mint>,
    #[account(mut, token::mint = mint, token::authority = loan)] pub collateral_vault: Account<'info, TokenAccount>,
    #[account(mut, token::mint = mint, token::authority = policy)] pub treasury_vault: Account<'info, TokenAccount>,
    #[account(mut, token::mint = mint, token::authority = profile.borrower)] pub borrower_token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct LendingPolicy { pub authority: Pubkey, pub score_authority: Pubkey, pub mint: Pubkey, pub treasury_vault: Pubkey, pub policy_id: u64, pub version: u32, pub min_score: u16, pub min_history_days: u16, pub initial_limit: u64, pub limit_step: u64, pub maximum_limit: u64, pub fee_bps: u16, pub term_seconds: i64, pub grace_seconds: i64, pub max_concurrent_loans: u8, pub reputation_exposure_cap: u64, pub active_reputation_exposure: u64, pub secured_collateral_bps: u16, pub cooldown_seconds: i64, pub paused: bool, pub bump: u8 }
#[account]
#[derive(InitSpace)]
pub struct BorrowerProfile { pub policy: Pubkey, pub borrower: Pubkey, pub score_version: u32, pub score: u16, pub activity_started_at: i64, pub evidence_hash: [u8; 32], pub score_updated_slot: u64, pub score_expires_at: i64, pub completed_loans: u16, pub defaulted_loans: u16, pub active_loans: u8, pub outstanding_debt: u64, pub cooldown_until: i64, pub next_loan_id: u64, pub bump: u8 }
#[account]
#[derive(InitSpace)]
pub struct Loan { pub policy: Pubkey, pub borrower: Pubkey, pub loan_id: u64, pub loan_type: LoanType, pub principal: u64, pub fee: u64, pub total_due: u64, pub repaid: u64, pub outstanding: u64, pub principal_outstanding: u64, pub collateral_amount: u64, pub collateral_vault: Pubkey, pub originated_at: i64, pub due_at: i64, pub closed_at: i64, pub policy_version: u32, pub score_version: u32, pub state: LoanState, pub collateral_liquidated: bool, pub collateral_released: bool, pub bump: u8 }

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum LoanType { Secured, Reputation }
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum LoanState { Active, PartiallyRepaid, Repaid, Overdue, Defaulted, Liquidated, Closed }

fn validate_usdc_mint(mint: &Account<Mint>) -> Result<()> { require_keys_eq!(mint.key(), NATIVE_USDC_MINT, LoanError::WrongMint); require!(mint.decimals == USDC_DECIMALS, LoanError::WrongDecimals); Ok(()) }
fn calculate_fee(amount: u64, fee_bps: u16) -> Result<u64> { amount.checked_mul(fee_bps as u64).ok_or(LoanError::ArithmeticOverflow)?.checked_div(BASIS_POINTS).ok_or_else(|| error!(LoanError::ArithmeticOverflow)) }
fn required_collateral(amount: u64, collateral_bps: u16) -> Result<u64> { amount.checked_mul(collateral_bps as u64).ok_or(LoanError::ArithmeticOverflow)?.checked_add(BASIS_POINTS - 1).ok_or(LoanError::ArithmeticOverflow)?.checked_div(BASIS_POINTS).ok_or_else(|| error!(LoanError::ArithmeticOverflow)) }
fn collateral_settlement(collateral: u64, outstanding: u64) -> (u64, u64) { let applied = collateral.min(outstanding); (applied, collateral - applied) }
fn current_limit(policy: &LendingPolicy, profile: &BorrowerProfile) -> Result<u64> { let growth = policy.limit_step.checked_mul(profile.completed_loans as u64).ok_or(LoanError::ArithmeticOverflow)?; Ok(policy.initial_limit.checked_add(growth).ok_or(LoanError::ArithmeticOverflow)?.min(policy.maximum_limit)) }

fn validate_eligibility(policy: &LendingPolicy, profile: &BorrowerProfile, loan_id: u64, amount: u64) -> Result<()> {
    let now = Clock::get()?.unix_timestamp;
    require!(!policy.paused, LoanError::PolicyPaused);
    require!(loan_id == profile.next_loan_id, LoanError::WrongLoanId);
    require!(profile.score >= policy.min_score, LoanError::ScoreTooLow);
    require!(profile.score_expires_at >= now, LoanError::ScoreExpired);
    let minimum_age = (policy.min_history_days as i64).checked_mul(SECONDS_PER_DAY).ok_or(LoanError::ArithmeticOverflow)?;
    require!(now.checked_sub(profile.activity_started_at).unwrap_or(-1) >= minimum_age, LoanError::InsufficientHistory);
    require!(profile.active_loans < policy.max_concurrent_loans, LoanError::TooManyActiveLoans);
    require!(profile.defaulted_loans == 0, LoanError::PriorDefault);
    require!(now >= profile.cooldown_until, LoanError::CooldownActive);
    require!(amount <= current_limit(policy, profile)?, LoanError::LoanLimitExceeded);
    Ok(())
}

#[allow(clippy::too_many_arguments)]
fn initialize_loan(loan: &mut Account<Loan>, policy: &Account<LendingPolicy>, profile: &Account<BorrowerProfile>, borrower: Pubkey, loan_id: u64, loan_type: LoanType, principal: u64, fee: u64, collateral_amount: u64, collateral_vault: Pubkey, now: i64, bump: u8) -> Result<()> {
    let total_due = principal.checked_add(fee).ok_or(LoanError::ArithmeticOverflow)?;
    loan.policy = policy.key(); loan.borrower = borrower; loan.loan_id = loan_id; loan.loan_type = loan_type; loan.principal = principal; loan.fee = fee; loan.total_due = total_due; loan.repaid = 0; loan.outstanding = total_due; loan.principal_outstanding = principal; loan.collateral_amount = collateral_amount; loan.collateral_vault = collateral_vault; loan.originated_at = now; loan.due_at = now.checked_add(policy.term_seconds).ok_or(LoanError::ArithmeticOverflow)?; loan.closed_at = 0; loan.policy_version = policy.version; loan.score_version = profile.score_version; loan.state = LoanState::Active; loan.collateral_liquidated = false; loan.collateral_released = false; loan.bump = bump; Ok(())
}

fn transfer_from_treasury<'info>(policy: &Account<'info, LendingPolicy>, from: &Account<'info, TokenAccount>, mint: &Account<'info, Mint>, to: &Account<'info, TokenAccount>, token_program: &Program<'info, Token>, amount: u64) -> Result<()> { let id = policy.policy_id.to_le_bytes(); let bump = [policy.bump]; let signer: &[&[u8]] = &[b"policy", policy.authority.as_ref(), id.as_ref(), bump.as_ref()]; token::transfer_checked(CpiContext::new_with_signer(token_program.key(), TransferChecked { from: from.to_account_info(), mint: mint.to_account_info(), to: to.to_account_info(), authority: policy.to_account_info() }, &[signer]), amount, USDC_DECIMALS) }
fn transfer_from_loan<'info>(loan: &Account<'info, Loan>, from: &Account<'info, TokenAccount>, mint: &Account<'info, Mint>, to: &Account<'info, TokenAccount>, token_program: &Program<'info, Token>, amount: u64) -> Result<()> { let id = loan.loan_id.to_le_bytes(); let bump = [loan.bump]; let signer: &[&[u8]] = &[b"loan", loan.policy.as_ref(), loan.borrower.as_ref(), id.as_ref(), bump.as_ref()]; token::transfer_checked(CpiContext::new_with_signer(token_program.key(), TransferChecked { from: from.to_account_info(), mint: mint.to_account_info(), to: to.to_account_info(), authority: loan.to_account_info() }, &[signer]), amount, USDC_DECIMALS) }

#[event] pub struct PolicyCreated { pub policy: Pubkey, pub policy_id: u64, pub version: u32 }
#[event] pub struct ScoreAttested { pub policy: Pubkey, pub borrower: Pubkey, pub score: u16, pub score_version: u32, pub evidence_hash: [u8; 32] }
#[event] pub struct TreasuryFunded { pub policy: Pubkey, pub funder: Pubkey, pub amount: u64 }
#[event] pub struct LoanDisbursed { pub policy: Pubkey, pub loan: Pubkey, pub borrower: Pubkey, pub loan_type: LoanType, pub principal: u64, pub fee: u64, pub due_at: i64 }
#[event] pub struct LoanRepaid { pub policy: Pubkey, pub loan: Pubkey, pub borrower: Pubkey, pub amount: u64, pub outstanding_after: u64, pub fully_repaid: bool }
#[event] pub struct LoanOverdue { pub policy: Pubkey, pub loan: Pubkey, pub borrower: Pubkey }
#[event] pub struct LoanDefaulted { pub policy: Pubkey, pub loan: Pubkey, pub borrower: Pubkey, pub outstanding: u64 }
#[event] pub struct ReputationLoanWrittenOff { pub policy: Pubkey, pub loan: Pubkey, pub borrower: Pubkey, pub amount: u64, pub principal_exposure_released: u64 }
#[event] pub struct CollateralReleased { pub policy: Pubkey, pub loan: Pubkey, pub borrower: Pubkey, pub amount: u64 }
#[event] pub struct CollateralLiquidated { pub policy: Pubkey, pub loan: Pubkey, pub borrower: Pubkey, pub collateral: u64, pub applied_to_debt: u64, pub surplus_returned: u64, pub debt_remaining: u64 }

#[error_code]
pub enum LoanError {
    #[msg("Amount must be greater than zero")] ZeroAmount,
    #[msg("Only Circle-issued native Solana USDC is accepted")] WrongMint,
    #[msg("USDC must use six decimals")] WrongDecimals,
    #[msg("Policy parameters are invalid")] InvalidPolicy,
    #[msg("Signer is not authorized")] Unauthorized,
    #[msg("Score must be between 0 and 1000")] InvalidScore,
    #[msg("Activity history timestamp is invalid")] InvalidHistory,
    #[msg("Score attestation must expire in the future")] InvalidScoreExpiry,
    #[msg("Score version cannot move backwards")] StaleScoreVersion,
    #[msg("Supplied account belongs to another policy")] WrongPolicy,
    #[msg("Supplied treasury is not the isolated Lending Treasury")] WrongTreasury,
    #[msg("Policy is paused")] PolicyPaused,
    #[msg("Loan ID must be the borrower's next sequential ID")] WrongLoanId,
    #[msg("StashScore is below the configured minimum")] ScoreTooLow,
    #[msg("StashScore attestation has expired")] ScoreExpired,
    #[msg("Verified account/activity history is too short")] InsufficientHistory,
    #[msg("Maximum concurrent loans reached")] TooManyActiveLoans,
    #[msg("A prior default blocks reputation borrowing under this policy")] PriorDefault,
    #[msg("Borrower cooldown is still active")] CooldownActive,
    #[msg("Requested amount exceeds the versioned policy limit")] LoanLimitExceeded,
    #[msg("Reputation lending exposure cap would be exceeded")] ExposureCapExceeded,
    #[msg("Lending Treasury does not have enough liquidity")] InsufficientTreasuryLiquidity,
    #[msg("Arithmetic overflow or underflow")] ArithmeticOverflow,
    #[msg("Collateral does not meet the configured ratio")] InsufficientCollateral,
    #[msg("Loan is in the wrong state for this operation")] InvalidLoanState,
    #[msg("Repayment cannot exceed outstanding debt")] RepaymentTooLarge,
    #[msg("Loan is not overdue yet")] NotOverdue,
    #[msg("Default grace period is still active")] GracePeriodActive,
    #[msg("Borrower profile does not match the loan borrower")] BorrowerSubstitution,
    #[msg("Loan is not secured")] NotSecuredLoan,
    #[msg("Loan is not a reputation loan")] NotReputationLoan,
    #[msg("Collateral was already liquidated")] AlreadyLiquidated,
    #[msg("Supplied collateral vault is incorrect")] WrongCollateralVault,
    #[msg("Collateral vault cannot satisfy recorded collateral")] CollateralVaultInsolvent,
    #[msg("Repaid collateral was already released")] CollateralAlreadyReleased,
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn fee_math_is_checked() { assert_eq!(calculate_fee(50_000_000, 400).unwrap(), 2_000_000); assert!(calculate_fee(u64::MAX, 10_000).is_err()); }
    #[test] fn collateral_rounds_up() { assert_eq!(required_collateral(101, 15_000).unwrap(), 152); }
    #[test] fn liquidation_returns_surplus() { assert_eq!(collateral_settlement(150, 100), (100, 50)); assert_eq!(collateral_settlement(80, 100), (80, 0)); }
    #[test] fn limits_grow_but_remain_capped() { let policy = LendingPolicy { authority: Pubkey::default(), score_authority: Pubkey::default(), mint: Pubkey::default(), treasury_vault: Pubkey::default(), policy_id: 0, version: 1, min_score: 0, min_history_days: 0, initial_limit: 100, limit_step: 50, maximum_limit: 200, fee_bps: 0, term_seconds: 1, grace_seconds: 0, max_concurrent_loans: 1, reputation_exposure_cap: 1_000, active_reputation_exposure: 0, secured_collateral_bps: 10_000, cooldown_seconds: 0, paused: false, bump: 0 }; let mut profile = BorrowerProfile { policy: Pubkey::default(), borrower: Pubkey::default(), score_version: 1, score: 0, activity_started_at: 0, evidence_hash: [0; 32], score_updated_slot: 0, score_expires_at: 0, completed_loans: 3, defaulted_loans: 0, active_loans: 0, outstanding_debt: 0, cooldown_until: 0, next_loan_id: 0, bump: 0 }; assert_eq!(current_limit(&policy, &profile).unwrap(), 200); profile.completed_loans = 0; assert_eq!(current_limit(&policy, &profile).unwrap(), 100); }
}
