use anchor_lang::prelude::*;
use anchor_lang::solana_program::{hash::hashv, instruction::{AccountMeta, Instruction}, program::invoke_signed, pubkey};
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};

declare_id!("3LZnxEiTTGpfVQNHzBL683iFaspkYyxreyzMQEUqRqMj");

pub const NATIVE_USDC_MINT: Pubkey = pubkey!("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
pub const KAMINO_LEND_PROGRAM: Pubkey = pubkey!("KLend2g3cP87fffoy8q1mQqGKjrxjC8boSyAYavgmjD");
pub const DRIFT_PROGRAM: Pubkey = pubkey!("dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH");
pub const PROJECT_ZERO_PROGRAM: Pubkey = pubkey!("MFv2hWf31Z9kbCa1snEPYctwafyhdvnV7FZnsebVacA");
pub const USDC_DECIMALS: u8 = 6;
pub const BASIS_POINTS: u64 = 10_000;
pub const WINNER_BPS: u64 = 8_500;
pub const ORAO_VRF_PROGRAM: Pubkey = pubkey!("VRFzZoJdhFWL8rkvu87LpKM3RbcVezpMEc6X5GVDr7y");
pub const STASHPOT_VRF_ADAPTER_PROGRAM: Pubkey = pubkey!("AtRDA6ABdzQRiJcBu4yCdCc4XAqZ3dwWx9uH8XatWLMS");
pub const VRF_RECEIPT_DISCRIMINATOR: [u8; 8] = [77, 42, 225, 86, 30, 62, 101, 123];
pub const VRF_REQUEST_IX_DISCRIMINATOR: [u8; 8] = [213, 5, 173, 166, 37, 236, 31, 18];

#[program]
pub mod prize_savings {
    use super::*;

    pub fn create_registry(ctx: Context<CreateRegistry>, version: u32) -> Result<()> {
        require!(version > 0, PrizeError::InvalidVersion);
        validate_usdc_mint(&ctx.accounts.mint)?;
        let registry = &mut ctx.accounts.registry;
        registry.authority = ctx.accounts.authority.key();
        registry.emergency_authority = ctx.accounts.emergency_authority.key();
        registry.mint = ctx.accounts.mint.key();
        registry.version = version;
        registry.strategy_count = 0;
        registry.total_allocation_bps = 0;
        registry.paused = true;
        registry.bump = ctx.bumps.registry;
        Ok(())
    }

    pub fn register_strategy(
        ctx: Context<RegisterStrategy>,
        strategy_id: u16,
        kind: StrategyKind,
        protocol_program: Pubkey,
        market: Pubkey,
        reserve: Pubkey,
        receipt_mint: Pubkey,
        allocation_bps: u16,
    ) -> Result<()> {
        require!(allocation_bps as u64 <= BASIS_POINTS, PrizeError::InvalidAllocation);
        require_keys_eq!(expected_protocol(kind), protocol_program, PrizeError::WrongProtocol);
        require!(market != Pubkey::default() && reserve != Pubkey::default(), PrizeError::InvalidStrategyAccount);
        let next_total = ctx.accounts.registry.total_allocation_bps
            .checked_add(allocation_bps)
            .ok_or(PrizeError::ArithmeticOverflow)?;
        require!(next_total as u64 <= BASIS_POINTS, PrizeError::InvalidAllocation);

        let strategy = &mut ctx.accounts.strategy;
        strategy.registry = ctx.accounts.registry.key();
        strategy.strategy_id = strategy_id;
        strategy.kind = kind;
        strategy.protocol_program = protocol_program;
        strategy.market = market;
        strategy.reserve = reserve;
        strategy.receipt_mint = receipt_mint;
        strategy.allocation_bps = allocation_bps;
        strategy.enabled = false;
        strategy.deposits_paused = true;
        strategy.bump = ctx.bumps.strategy;
        let registry = &mut ctx.accounts.registry;
        registry.strategy_count = registry.strategy_count.checked_add(1).ok_or(PrizeError::ArithmeticOverflow)?;
        registry.total_allocation_bps = next_total;
        Ok(())
    }

    pub fn set_registry_pause(ctx: Context<ManageRegistry>, paused: bool) -> Result<()> {
        ctx.accounts.registry.paused = paused;
        Ok(())
    }

    pub fn emergency_pause_registry(ctx: Context<EmergencyPauseRegistry>) -> Result<()> {
        ctx.accounts.registry.paused = true;
        Ok(())
    }

    pub fn create_pool(
        ctx: Context<CreatePool>,
        pool_id: u64,
        minimum_principal: u64,
        holding_period_seconds: i64,
        weight_model: WeightModel,
    ) -> Result<()> {
        validate_usdc_mint(&ctx.accounts.mint)?;
        require!(minimum_principal > 0, PrizeError::ZeroAmount);
        require!(holding_period_seconds >= 0, PrizeError::InvalidHoldingPeriod);
        let pool = &mut ctx.accounts.pool;
        pool.authority = ctx.accounts.authority.key();
        pool.randomness_authority = ctx.accounts.randomness_authority.key();
        pool.strategy_registry = ctx.accounts.registry.key();
        pool.mint = ctx.accounts.mint.key();
        pool.principal_vault = ctx.accounts.principal_vault.key();
        pool.reward_vault = ctx.accounts.reward_vault.key();
        pool.treasury_token = ctx.accounts.treasury_token.key();
        pool.pool_id = pool_id;
        pool.minimum_principal = minimum_principal;
        pool.holding_period_seconds = holding_period_seconds;
        pool.weight_model = weight_model;
        pool.total_principal_liability = 0;
        pool.principal_deployed = 0;
        pool.realized_reward_available = 0;
        pool.total_rewards_distributed = 0;
        pool.total_treasury_distributed = 0;
        pool.participant_count = 0;
        pool.next_draw_id = 0;
        pool.draw_state = DrawState::Idle;
        pool.bump = ctx.bumps.pool;
        emit!(PoolCreated { pool: pool.key(), authority: pool.authority, pool_id });
        Ok(())
    }

    pub fn join_pool(ctx: Context<JoinPool>) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let participant = &mut ctx.accounts.participant;
        participant.pool = ctx.accounts.pool.key();
        participant.owner = ctx.accounts.owner.key();
        participant.principal = 0;
        participant.withdrawn_principal = 0;
        participant.rewards_won = 0;
        participant.eligible_since = now;
        participant.bump = ctx.bumps.participant;
        ctx.accounts.pool.participant_count = ctx.accounts.pool.participant_count
            .checked_add(1).ok_or(PrizeError::ArithmeticOverflow)?;
        emit!(ParticipantJoined { pool: ctx.accounts.pool.key(), participant: participant.key(), owner: participant.owner });
        Ok(())
    }

    pub fn deposit_principal(ctx: Context<UseParticipant>, amount: u64) -> Result<()> {
        require!(amount > 0, PrizeError::ZeroAmount);
        require!(ctx.accounts.pool.draw_state == DrawState::Idle, PrizeError::DrawInProgress);
        validate_usdc_mint(&ctx.accounts.mint)?;
        let participant_after = ctx.accounts.participant.principal.checked_add(amount).ok_or(PrizeError::ArithmeticOverflow)?;
        let liability_after = ctx.accounts.pool.total_principal_liability.checked_add(amount).ok_or(PrizeError::ArithmeticOverflow)?;
        token::transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.key(),
                TransferChecked {
                    from: ctx.accounts.owner_token.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.principal_vault.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(),
                },
            ), amount, USDC_DECIMALS,
        )?;
        if ctx.accounts.participant.principal < ctx.accounts.pool.minimum_principal
            && participant_after >= ctx.accounts.pool.minimum_principal
        {
            ctx.accounts.participant.eligible_since = Clock::get()?.unix_timestamp;
        }
        ctx.accounts.participant.principal = participant_after;
        ctx.accounts.pool.total_principal_liability = liability_after;
        assert_idle_principal_solvency(&ctx.accounts.pool, &ctx.accounts.principal_vault)?;
        emit!(PrincipalDeposited { pool: ctx.accounts.pool.key(), owner: ctx.accounts.owner.key(), amount, principal_after: participant_after });
        Ok(())
    }

    pub fn withdraw_principal(ctx: Context<UseParticipant>, amount: u64) -> Result<()> {
        require!(amount > 0, PrizeError::ZeroAmount);
        require!(ctx.accounts.pool.draw_state == DrawState::Idle, PrizeError::DrawInProgress);
        validate_usdc_mint(&ctx.accounts.mint)?;
        let participant_after = ctx.accounts.participant.principal.checked_sub(amount).ok_or(PrizeError::InsufficientPrincipal)?;
        let liability_after = ctx.accounts.pool.total_principal_liability.checked_sub(amount).ok_or(PrizeError::ArithmeticOverflow)?;
        require!(ctx.accounts.principal_vault.amount >= amount, PrizeError::WithdrawalConstrained);

        transfer_from_pool(
            &ctx.accounts.pool,
            &ctx.accounts.principal_vault,
            &ctx.accounts.mint,
            &ctx.accounts.owner_token,
            &ctx.accounts.token_program,
            amount,
        )?;
        ctx.accounts.participant.principal = participant_after;
        if participant_after < ctx.accounts.pool.minimum_principal {
            ctx.accounts.participant.eligible_since = Clock::get()?.unix_timestamp;
        }
        ctx.accounts.participant.withdrawn_principal = ctx.accounts.participant.withdrawn_principal.checked_add(amount).ok_or(PrizeError::ArithmeticOverflow)?;
        ctx.accounts.pool.total_principal_liability = liability_after;
        assert_idle_principal_solvency(&ctx.accounts.pool, &ctx.accounts.principal_vault)?;
        emit!(PrincipalWithdrawn { pool: ctx.accounts.pool.key(), owner: ctx.accounts.owner.key(), amount, principal_after: participant_after });
        Ok(())
    }

    pub fn fund_manual_reward(ctx: Context<FundReward>, amount: u64) -> Result<()> {
        require!(amount > 0, PrizeError::ZeroAmount);
        validate_usdc_mint(&ctx.accounts.mint)?;
        let reward_after = ctx.accounts.pool.realized_reward_available.checked_add(amount).ok_or(PrizeError::ArithmeticOverflow)?;
        token::transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.key(),
                TransferChecked {
                    from: ctx.accounts.funder_token.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.reward_vault.to_account_info(),
                    authority: ctx.accounts.funder.to_account_info(),
                },
            ), amount, USDC_DECIMALS,
        )?;
        ctx.accounts.pool.realized_reward_available = reward_after;
        emit!(RewardFunded { pool: ctx.accounts.pool.key(), funder: ctx.accounts.funder.key(), amount, source: RewardSource::Manual });
        Ok(())
    }

    pub fn start_draw(ctx: Context<StartDraw>, draw_id: u64, reward_amount: u64, cutoff_at: i64) -> Result<()> {
        require!(ctx.accounts.pool.draw_state == DrawState::Idle, PrizeError::DrawInProgress);
        require!(draw_id == ctx.accounts.pool.next_draw_id, PrizeError::WrongDrawId);
        require!(reward_amount > 0 && reward_amount <= ctx.accounts.pool.realized_reward_available, PrizeError::InsufficientReward);
        let now = Clock::get()?.unix_timestamp;
        require!(cutoff_at >= now, PrizeError::InvalidCutoff);
        assert_idle_principal_solvency(&ctx.accounts.pool, &ctx.accounts.principal_vault)?;
        require!(ctx.accounts.reward_vault.amount >= reward_amount, PrizeError::InsufficientReward);
        let (winner_amount, treasury_amount) = split_reward(reward_amount)?;

        let draw = &mut ctx.accounts.draw;
        draw.pool = ctx.accounts.pool.key();
        draw.draw_id = draw_id;
        draw.cutoff_at = cutoff_at;
        draw.reward_amount = reward_amount;
        draw.winner_amount = winner_amount;
        draw.treasury_amount = treasury_amount;
        draw.winner = Pubkey::default();
        draw.snapshot_total_weight = 0;
        draw.snapshot_entry_count = 0;
        draw.snapshot_frozen = false;
        draw.randomness_request = Pubkey::default();
        draw.randomness_seed = [0u8; 32];
        draw.state = DrawState::Finalizing;
        draw.winner_claimed = false;
        draw.treasury_claimed = false;
        draw.bump = ctx.bumps.draw;
        let pool = &mut ctx.accounts.pool;
        pool.realized_reward_available = pool.realized_reward_available.checked_sub(reward_amount).ok_or(PrizeError::ArithmeticOverflow)?;
        pool.draw_state = DrawState::Finalizing;
        emit!(DrawStarted { pool: pool.key(), draw: draw.key(), draw_id, reward_amount, cutoff_at });
        Ok(())
    }

    /// Registers one immutable eligibility/weight interval before the draw cutoff.
    /// Each participant has exactly one PDA entry per draw, preventing duplicate weight.
    pub fn register_draw_entry(ctx: Context<RegisterDrawEntry>) -> Result<()> {
        require!(ctx.accounts.pool.draw_state == DrawState::Finalizing, PrizeError::WrongDrawState);
        require!(ctx.accounts.draw.state == DrawState::Finalizing && !ctx.accounts.draw.snapshot_frozen, PrizeError::SnapshotFrozen);
        let now = Clock::get()?.unix_timestamp;
        require!(now <= ctx.accounts.draw.cutoff_at, PrizeError::SnapshotClosed);
        require!(participant_is_eligible(&ctx.accounts.pool, &ctx.accounts.participant, now), PrizeError::NotEligible);
        let weight = participant_weight(&ctx.accounts.pool, &ctx.accounts.participant)?;
        require!(weight > 0, PrizeError::NotEligible);
        let start = ctx.accounts.draw.snapshot_total_weight;
        let end = start.checked_add(weight).ok_or(PrizeError::ArithmeticOverflow)?;
        let entry = &mut ctx.accounts.entry;
        entry.draw = ctx.accounts.draw.key();
        entry.participant = ctx.accounts.participant.key();
        entry.owner = ctx.accounts.owner.key();
        entry.weight = weight;
        entry.range_start = start;
        entry.range_end = end;
        entry.bump = ctx.bumps.entry;
        ctx.accounts.draw.snapshot_total_weight = end;
        ctx.accounts.draw.snapshot_entry_count = ctx.accounts.draw.snapshot_entry_count.checked_add(1).ok_or(PrizeError::ArithmeticOverflow)?;
        emit!(DrawEntryRegistered { draw: ctx.accounts.draw.key(), owner: entry.owner, weight, range_start: start, range_end: end });
        Ok(())
    }

    /// Freezes the participant/weight snapshot after cutoff. No entry can be
    /// added afterwards. The next transition is a verified ORAO request.
    pub fn freeze_draw_snapshot(ctx: Context<FreezeDrawSnapshot>) -> Result<()> {
        require!(ctx.accounts.draw.state == DrawState::Finalizing, PrizeError::WrongDrawState);
        require!(!ctx.accounts.draw.snapshot_frozen, PrizeError::SnapshotFrozen);
        require!(Clock::get()?.unix_timestamp >= ctx.accounts.draw.cutoff_at, PrizeError::CutoffNotReached);
        require!(ctx.accounts.draw.snapshot_entry_count > 0 && ctx.accounts.draw.snapshot_total_weight > 0, PrizeError::EmptySnapshot);
        ctx.accounts.draw.snapshot_frozen = true;
        emit!(DrawSnapshotFrozen { draw: ctx.accounts.draw.key(), entry_count: ctx.accounts.draw.snapshot_entry_count, total_weight: ctx.accounts.draw.snapshot_total_weight });
        Ok(())
    }

    /// Requests ORAO randomness through the isolated Anchor-0.32 adapter.
    /// The adapter accepts requests only when this program's pool-specific PDA
    /// signs the CPI, so nobody can pre-request the draw seed before snapshot freeze.
    pub fn request_multi_draw_randomness(ctx: Context<RequestMultiDrawRandomness>) -> Result<()> {
        require!(ctx.accounts.pool.participant_count > 1, PrizeError::NotMultiPool);
        require!(ctx.accounts.draw.state == DrawState::Finalizing, PrizeError::WrongDrawState);
        require!(ctx.accounts.draw.snapshot_frozen, PrizeError::SnapshotNotFrozen);
        require!(ctx.accounts.draw.randomness_request == Pubkey::default(), PrizeError::RandomnessAlreadyRequested);
        require_keys_eq!(ctx.accounts.vrf_adapter.key(), STASHPOT_VRF_ADAPTER_PROGRAM, PrizeError::WrongRandomnessAdapter);

        let slot = Clock::get()?.slot.to_le_bytes();
        let draw_id = ctx.accounts.draw.draw_id.to_le_bytes();
        let weight = ctx.accounts.draw.snapshot_total_weight.to_le_bytes();
        let seed = hashv(&[b"stashpot-prize-v1", ctx.accounts.draw.key().as_ref(), &draw_id, &weight, &slot]).to_bytes();
        let expected_state = Pubkey::find_program_address(
            &[b"vrf-state", ctx.accounts.draw.key().as_ref()],
            &STASHPOT_VRF_ADAPTER_PROGRAM,
        ).0;
        require_keys_eq!(ctx.accounts.adapter_state.key(), expected_state, PrizeError::WrongRandomnessReceipt);

        let mut data = Vec::with_capacity(40);
        data.extend_from_slice(&VRF_REQUEST_IX_DISCRIMINATOR);
        data.extend_from_slice(&seed);
        let ix = Instruction {
            program_id: STASHPOT_VRF_ADAPTER_PROGRAM,
            accounts: vec![
                AccountMeta::new(ctx.accounts.authority.key(), true),
                AccountMeta::new_readonly(ctx.accounts.pool.key(), false),
                AccountMeta::new_readonly(ctx.accounts.vrf_authority.key(), true),
                AccountMeta::new_readonly(ctx.accounts.draw.key(), false),
                AccountMeta::new(ctx.accounts.adapter_state.key(), false),
                AccountMeta::new(ctx.accounts.randomness_request.key(), false),
                AccountMeta::new(ctx.accounts.orao_treasury.key(), false),
                AccountMeta::new(ctx.accounts.orao_network_state.key(), false),
                AccountMeta::new_readonly(ctx.accounts.orao_vrf.key(), false),
                AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
            ],
            data,
        };
        let bump = [ctx.bumps.vrf_authority];
        let signer: &[&[u8]] = &[b"vrf-authority", ctx.accounts.pool.key().as_ref(), bump.as_ref()];
        invoke_signed(
            &ix,
            &[
                ctx.accounts.authority.to_account_info(),
                ctx.accounts.pool.to_account_info(),
                ctx.accounts.vrf_authority.to_account_info(),
                ctx.accounts.draw.to_account_info(),
                ctx.accounts.adapter_state.to_account_info(),
                ctx.accounts.randomness_request.to_account_info(),
                ctx.accounts.orao_treasury.to_account_info(),
                ctx.accounts.orao_network_state.to_account_info(),
                ctx.accounts.orao_vrf.to_account_info(),
                ctx.accounts.system_program.to_account_info(),
                ctx.accounts.vrf_adapter.to_account_info(),
            ],
            &[signer],
        )?;
        ctx.accounts.draw.randomness_request = ctx.accounts.randomness_request.key();
        ctx.accounts.draw.randomness_seed = seed;
        emit!(RandomnessRequested { draw: ctx.accounts.draw.key(), request: ctx.accounts.randomness_request.key(), seed });
        Ok(())
    }

    /// Finalizes a multi-user draw from a receipt produced by the isolated
    /// StashPot VRF adapter. The adapter is the only component linked to the
    /// ORAO Anchor 0.32.x SDK; this Anchor 1.x financial program verifies the
    /// adapter-owned PDA and parses its stable receipt layout manually.
    pub fn finalize_multi_draw(ctx: Context<FinalizeMultiDraw>) -> Result<()> {
        require!(ctx.accounts.pool.participant_count > 1, PrizeError::NotMultiPool);
        require!(ctx.accounts.pool.draw_state == DrawState::Finalizing, PrizeError::WrongDrawState);
        require!(ctx.accounts.draw.state == DrawState::Finalizing, PrizeError::WrongDrawState);
        require!(ctx.accounts.draw.snapshot_frozen, PrizeError::SnapshotNotFrozen);
        require!(ctx.accounts.draw.snapshot_total_weight > 0, PrizeError::EmptySnapshot);
        require_keys_eq!(*ctx.accounts.randomness_receipt.owner, STASHPOT_VRF_ADAPTER_PROGRAM, PrizeError::WrongRandomnessAdapter);
        let expected_receipt = Pubkey::find_program_address(
            &[b"receipt", ctx.accounts.draw.key().as_ref()],
            &STASHPOT_VRF_ADAPTER_PROGRAM,
        ).0;
        require_keys_eq!(ctx.accounts.randomness_receipt.key(), expected_receipt, PrizeError::WrongRandomnessReceipt);

        let receipt = parse_randomness_receipt(&ctx.accounts.randomness_receipt)?;
        require_keys_eq!(receipt.draw, ctx.accounts.draw.key(), PrizeError::WrongRandomnessReceipt);
        if ctx.accounts.draw.randomness_request != Pubkey::default() {
            require_keys_eq!(receipt.request, ctx.accounts.draw.randomness_request, PrizeError::WrongRandomnessReceipt);
        }
        if ctx.accounts.draw.randomness_seed != [0u8; 32] {
            require!(receipt.seed == ctx.accounts.draw.randomness_seed, PrizeError::WrongRandomnessReceipt);
        }
        let offset = unbiased_weighted_offset(&receipt.randomness, ctx.accounts.draw.snapshot_total_weight)?;
        require_keys_eq!(ctx.accounts.entry.draw, ctx.accounts.draw.key(), PrizeError::WrongDrawEntry);
        require!(draw_entry_contains(&ctx.accounts.entry, offset), PrizeError::WrongDrawEntry);

        ctx.accounts.draw.randomness_request = receipt.request;
        ctx.accounts.draw.randomness_seed = receipt.seed;
        ctx.accounts.draw.winner = ctx.accounts.entry.owner;
        ctx.accounts.draw.state = DrawState::Claimable;
        ctx.accounts.pool.draw_state = DrawState::Claimable;
        ctx.accounts.participant.rewards_won = ctx.accounts.participant.rewards_won
            .checked_add(ctx.accounts.draw.winner_amount).ok_or(PrizeError::ArithmeticOverflow)?;
        emit!(DrawFinalized { pool: ctx.accounts.pool.key(), draw: ctx.accounts.draw.key(), winner: ctx.accounts.entry.owner, solo: false });
        Ok(())
    }

    pub fn finalize_solo_draw(ctx: Context<FinalizeSoloDraw>) -> Result<()> {
        require!(ctx.accounts.pool.participant_count == 1, PrizeError::NotSoloPool);
        require!(ctx.accounts.pool.draw_state == DrawState::Finalizing, PrizeError::WrongDrawState);
        require!(ctx.accounts.draw.state == DrawState::Finalizing, PrizeError::WrongDrawState);
        let now = Clock::get()?.unix_timestamp;
        require!(now >= ctx.accounts.draw.cutoff_at, PrizeError::CutoffNotReached);
        require!(participant_is_eligible(&ctx.accounts.pool, &ctx.accounts.participant, ctx.accounts.draw.cutoff_at), PrizeError::NotEligible);
        ctx.accounts.draw.winner = ctx.accounts.participant.owner;
        ctx.accounts.draw.state = DrawState::Claimable;
        ctx.accounts.pool.draw_state = DrawState::Claimable;
        ctx.accounts.participant.rewards_won = ctx.accounts.participant.rewards_won
            .checked_add(ctx.accounts.draw.winner_amount).ok_or(PrizeError::ArithmeticOverflow)?;
        emit!(DrawFinalized { pool: ctx.accounts.pool.key(), draw: ctx.accounts.draw.key(), winner: ctx.accounts.participant.owner, solo: true });
        Ok(())
    }

    pub fn claim_winner_reward(ctx: Context<ClaimWinnerReward>) -> Result<()> {
        require!(ctx.accounts.draw.state == DrawState::Claimable, PrizeError::WrongDrawState);
        require_keys_eq!(ctx.accounts.draw.winner, ctx.accounts.winner.key(), PrizeError::Unauthorized);
        require!(!ctx.accounts.draw.winner_claimed, PrizeError::AlreadyClaimed);
        let amount = ctx.accounts.draw.winner_amount;
        require!(ctx.accounts.reward_vault.amount >= amount, PrizeError::InsufficientReward);
        transfer_from_pool(&ctx.accounts.pool, &ctx.accounts.reward_vault, &ctx.accounts.mint, &ctx.accounts.winner_token, &ctx.accounts.token_program, amount)?;
        ctx.accounts.draw.winner_claimed = true;
        ctx.accounts.pool.total_rewards_distributed = ctx.accounts.pool.total_rewards_distributed.checked_add(amount).ok_or(PrizeError::ArithmeticOverflow)?;
        emit!(WinnerRewardClaimed { pool: ctx.accounts.pool.key(), draw: ctx.accounts.draw.key(), winner: ctx.accounts.winner.key(), amount });
        Ok(())
    }

    pub fn claim_treasury_reward(ctx: Context<ClaimTreasuryReward>) -> Result<()> {
        require!(ctx.accounts.draw.state == DrawState::Claimable, PrizeError::WrongDrawState);
        require!(!ctx.accounts.draw.treasury_claimed, PrizeError::AlreadyClaimed);
        let amount = ctx.accounts.draw.treasury_amount;
        require!(ctx.accounts.reward_vault.amount >= amount, PrizeError::InsufficientReward);
        transfer_from_pool(&ctx.accounts.pool, &ctx.accounts.reward_vault, &ctx.accounts.mint, &ctx.accounts.treasury_token, &ctx.accounts.token_program, amount)?;
        ctx.accounts.draw.treasury_claimed = true;
        ctx.accounts.pool.total_treasury_distributed = ctx.accounts.pool.total_treasury_distributed.checked_add(amount).ok_or(PrizeError::ArithmeticOverflow)?;
        emit!(TreasuryRewardClaimed { pool: ctx.accounts.pool.key(), draw: ctx.accounts.draw.key(), amount });
        Ok(())
    }

    pub fn complete_draw(ctx: Context<CompleteDraw>) -> Result<()> {
        require!(ctx.accounts.pool.draw_state == DrawState::Claimable, PrizeError::WrongDrawState);
        require!(ctx.accounts.draw.state == DrawState::Claimable, PrizeError::WrongDrawState);
        require!(ctx.accounts.draw.winner_claimed && ctx.accounts.draw.treasury_claimed, PrizeError::UnclaimedAllocation);
        ctx.accounts.draw.state = DrawState::Complete;
        ctx.accounts.pool.draw_state = DrawState::Idle;
        ctx.accounts.pool.next_draw_id = ctx.accounts.pool.next_draw_id.checked_add(1).ok_or(PrizeError::ArithmeticOverflow)?;
        emit!(DrawCompleted { pool: ctx.accounts.pool.key(), draw: ctx.accounts.draw.key(), draw_id: ctx.accounts.draw.draw_id });
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(version: u32)]
pub struct CreateRegistry<'info> {
    #[account(mut)] pub authority: Signer<'info>,
    /// CHECK: Stored only as an emergency pause signer; it has no transfer authority.
    pub emergency_authority: UncheckedAccount<'info>,
    #[account(constraint = mint.key() == NATIVE_USDC_MINT @ PrizeError::WrongMint)] pub mint: Account<'info, Mint>,
    #[account(init, payer = authority, space = 8 + StrategyRegistry::INIT_SPACE, seeds = [b"strategy-registry", authority.key().as_ref(), &version.to_le_bytes()], bump)]
    pub registry: Account<'info, StrategyRegistry>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(strategy_id: u16)]
pub struct RegisterStrategy<'info> {
    #[account(mut)] pub authority: Signer<'info>,
    #[account(mut, has_one = authority @ PrizeError::Unauthorized)] pub registry: Account<'info, StrategyRegistry>,
    #[account(init, payer = authority, space = 8 + Strategy::INIT_SPACE, seeds = [b"strategy", registry.key().as_ref(), &strategy_id.to_le_bytes()], bump)]
    pub strategy: Account<'info, Strategy>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ManageRegistry<'info> {
    pub authority: Signer<'info>,
    #[account(mut, has_one = authority @ PrizeError::Unauthorized)] pub registry: Account<'info, StrategyRegistry>,
}

#[derive(Accounts)]
pub struct EmergencyPauseRegistry<'info> {
    pub emergency_authority: Signer<'info>,
    #[account(mut, has_one = emergency_authority @ PrizeError::Unauthorized)] pub registry: Account<'info, StrategyRegistry>,
}

#[derive(Accounts)]
#[instruction(pool_id: u64)]
pub struct CreatePool<'info> {
    #[account(mut)] pub authority: Signer<'info>,
    /// CHECK: This key may authorize a future reviewed VRF adapter but cannot move tokens.
    pub randomness_authority: UncheckedAccount<'info>,
    #[account(constraint = registry.mint == mint.key() @ PrizeError::WrongMint)] pub registry: Account<'info, StrategyRegistry>,
    #[account(constraint = mint.key() == NATIVE_USDC_MINT @ PrizeError::WrongMint)] pub mint: Account<'info, Mint>,
    #[account(init, payer = authority, space = 8 + PrizePool::INIT_SPACE, seeds = [b"pool", authority.key().as_ref(), &pool_id.to_le_bytes()], bump)]
    pub pool: Account<'info, PrizePool>,
    #[account(init, payer = authority, associated_token::mint = mint, associated_token::authority = pool, associated_token::token_program = token_program)]
    pub principal_vault: Account<'info, TokenAccount>,
    #[account(init, payer = authority, token::mint = mint, token::authority = pool, token::token_program = token_program, seeds = [b"reward-vault", pool.key().as_ref()], bump)]
    pub reward_vault: Account<'info, TokenAccount>,
    #[account(token::mint = mint, token::token_program = token_program)] pub treasury_token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct JoinPool<'info> {
    #[account(mut)] pub owner: Signer<'info>,
    #[account(mut)] pub pool: Account<'info, PrizePool>,
    #[account(init, payer = owner, space = 8 + Participant::INIT_SPACE, seeds = [b"participant", pool.key().as_ref(), owner.key().as_ref()], bump)]
    pub participant: Account<'info, Participant>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UseParticipant<'info> {
    #[account(mut)] pub owner: Signer<'info>,
    #[account(mut, has_one = mint @ PrizeError::WrongMint, has_one = principal_vault @ PrizeError::WrongVault, seeds = [b"pool", pool.authority.as_ref(), &pool.pool_id.to_le_bytes()], bump = pool.bump)]
    pub pool: Account<'info, PrizePool>,
    #[account(mut, has_one = pool @ PrizeError::WrongPool, has_one = owner @ PrizeError::Unauthorized, seeds = [b"participant", pool.key().as_ref(), owner.key().as_ref()], bump = participant.bump)]
    pub participant: Account<'info, Participant>,
    #[account(constraint = mint.key() == NATIVE_USDC_MINT @ PrizeError::WrongMint)] pub mint: Account<'info, Mint>,
    #[account(mut, token::mint = mint, token::authority = owner, token::token_program = token_program)] pub owner_token: Account<'info, TokenAccount>,
    #[account(mut, token::mint = mint, token::authority = pool, token::token_program = token_program)] pub principal_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct FundReward<'info> {
    #[account(mut)] pub funder: Signer<'info>,
    #[account(mut, has_one = mint @ PrizeError::WrongMint, has_one = reward_vault @ PrizeError::WrongVault)] pub pool: Account<'info, PrizePool>,
    #[account(constraint = mint.key() == NATIVE_USDC_MINT @ PrizeError::WrongMint)] pub mint: Account<'info, Mint>,
    #[account(mut, token::mint = mint, token::authority = funder, token::token_program = token_program)] pub funder_token: Account<'info, TokenAccount>,
    #[account(mut, token::mint = mint, token::authority = pool, token::token_program = token_program)] pub reward_vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
#[instruction(draw_id: u64)]
pub struct StartDraw<'info> {
    #[account(mut)] pub authority: Signer<'info>,
    #[account(mut, has_one = authority @ PrizeError::Unauthorized, has_one = principal_vault @ PrizeError::WrongVault, has_one = reward_vault @ PrizeError::WrongVault)] pub pool: Account<'info, PrizePool>,
    #[account(init, payer = authority, space = 8 + PrizeDraw::INIT_SPACE, seeds = [b"draw", pool.key().as_ref(), &draw_id.to_le_bytes()], bump)] pub draw: Account<'info, PrizeDraw>,
    #[account(token::authority = pool)] pub principal_vault: Account<'info, TokenAccount>,
    #[account(token::authority = pool)] pub reward_vault: Account<'info, TokenAccount>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RegisterDrawEntry<'info> {
    #[account(mut)] pub owner: Signer<'info>,
    pub pool: Account<'info, PrizePool>,
    #[account(mut, has_one = pool @ PrizeError::WrongPool)] pub draw: Account<'info, PrizeDraw>,
    #[account(has_one = pool @ PrizeError::WrongPool, has_one = owner @ PrizeError::Unauthorized, seeds = [b"participant", pool.key().as_ref(), owner.key().as_ref()], bump = participant.bump)] pub participant: Account<'info, Participant>,
    #[account(init, payer = owner, space = 8 + DrawEntry::INIT_SPACE, seeds = [b"draw-entry", draw.key().as_ref(), participant.key().as_ref()], bump)] pub entry: Account<'info, DrawEntry>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FreezeDrawSnapshot<'info> {
    #[account(mut)] pub authority: Signer<'info>,
    #[account(has_one = authority @ PrizeError::Unauthorized)] pub pool: Account<'info, PrizePool>,
    #[account(mut, has_one = pool @ PrizeError::WrongPool)] pub draw: Account<'info, PrizeDraw>,
}

#[derive(Accounts)]
pub struct RequestMultiDrawRandomness<'info> {
    #[account(mut)] pub authority: Signer<'info>,
    #[account(has_one = authority @ PrizeError::Unauthorized)] pub pool: Account<'info, PrizePool>,
    #[account(mut, has_one = pool @ PrizeError::WrongPool)] pub draw: Account<'info, PrizeDraw>,
    /// CHECK: PDA signer exists only to authorize the adapter CPI.
    #[account(seeds = [b"vrf-authority", pool.key().as_ref()], bump)] pub vrf_authority: UncheckedAccount<'info>,
    /// CHECK: validated against the adapter program constant.
    pub vrf_adapter: UncheckedAccount<'info>,
    /// CHECK: validated as the adapter state PDA in the handler; initialized by adapter CPI.
    #[account(mut)] pub adapter_state: UncheckedAccount<'info>,
    /// CHECK: validated as ORAO request PDA for the on-chain-derived seed.
    #[account(mut)] pub randomness_request: UncheckedAccount<'info>,
    /// CHECK: ORAO validates treasury during CPI.
    #[account(mut)] pub orao_treasury: UncheckedAccount<'info>,
    /// CHECK: ORAO validates network state during CPI.
    #[account(mut)] pub orao_network_state: UncheckedAccount<'info>,
    /// CHECK: must be classic ORAO VRF program.
    #[account(address = ORAO_VRF_PROGRAM)] pub orao_vrf: UncheckedAccount<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct FinalizeMultiDraw<'info> {
    #[account(mut)] pub pool: Account<'info, PrizePool>,
    #[account(mut, has_one = pool @ PrizeError::WrongPool)] pub draw: Account<'info, PrizeDraw>,
    #[account(has_one = draw @ PrizeError::WrongDrawEntry)] pub entry: Account<'info, DrawEntry>,
    #[account(mut, has_one = pool @ PrizeError::WrongPool, constraint = participant.key() == entry.participant @ PrizeError::WrongDrawEntry)]
    pub participant: Account<'info, Participant>,
    /// CHECK: owner, PDA, discriminator, draw, request and seed are validated in the handler.
    pub randomness_receipt: UncheckedAccount<'info>,
}

#[derive(Accounts)]
pub struct FinalizeSoloDraw<'info> {
    #[account(mut)] pub pool: Account<'info, PrizePool>,
    #[account(mut, has_one = pool @ PrizeError::WrongPool)] pub draw: Account<'info, PrizeDraw>,
    #[account(mut, has_one = pool @ PrizeError::WrongPool, seeds = [b"participant", pool.key().as_ref(), participant.owner.as_ref()], bump = participant.bump)] pub participant: Account<'info, Participant>,
}

#[derive(Accounts)]
pub struct ClaimWinnerReward<'info> {
    #[account(mut)] pub winner: Signer<'info>,
    #[account(mut, has_one = mint @ PrizeError::WrongMint, has_one = reward_vault @ PrizeError::WrongVault)] pub pool: Account<'info, PrizePool>,
    #[account(mut, has_one = pool @ PrizeError::WrongPool)] pub draw: Account<'info, PrizeDraw>,
    #[account(constraint = mint.key() == NATIVE_USDC_MINT @ PrizeError::WrongMint)] pub mint: Account<'info, Mint>,
    #[account(mut, token::mint = mint, token::authority = pool)] pub reward_vault: Account<'info, TokenAccount>,
    #[account(mut, token::mint = mint, token::authority = winner)] pub winner_token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimTreasuryReward<'info> {
    #[account(mut, has_one = mint @ PrizeError::WrongMint, has_one = reward_vault @ PrizeError::WrongVault, has_one = treasury_token @ PrizeError::WrongTreasury)] pub pool: Account<'info, PrizePool>,
    #[account(mut, has_one = pool @ PrizeError::WrongPool)] pub draw: Account<'info, PrizeDraw>,
    #[account(constraint = mint.key() == NATIVE_USDC_MINT @ PrizeError::WrongMint)] pub mint: Account<'info, Mint>,
    #[account(mut, token::mint = mint, token::authority = pool)] pub reward_vault: Account<'info, TokenAccount>,
    #[account(mut, token::mint = mint)] pub treasury_token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CompleteDraw<'info> {
    #[account(mut)] pub pool: Account<'info, PrizePool>,
    #[account(mut, has_one = pool @ PrizeError::WrongPool)] pub draw: Account<'info, PrizeDraw>,
}

#[account]
#[derive(InitSpace)]
pub struct StrategyRegistry { pub authority: Pubkey, pub emergency_authority: Pubkey, pub mint: Pubkey, pub version: u32, pub strategy_count: u16, pub total_allocation_bps: u16, pub paused: bool, pub bump: u8 }
#[account]
#[derive(InitSpace)]
pub struct Strategy { pub registry: Pubkey, pub strategy_id: u16, pub kind: StrategyKind, pub protocol_program: Pubkey, pub market: Pubkey, pub reserve: Pubkey, pub receipt_mint: Pubkey, pub allocation_bps: u16, pub enabled: bool, pub deposits_paused: bool, pub bump: u8 }
#[account]
#[derive(InitSpace)]
pub struct PrizePool { pub authority: Pubkey, pub randomness_authority: Pubkey, pub strategy_registry: Pubkey, pub mint: Pubkey, pub principal_vault: Pubkey, pub reward_vault: Pubkey, pub treasury_token: Pubkey, pub pool_id: u64, pub minimum_principal: u64, pub holding_period_seconds: i64, pub weight_model: WeightModel, pub total_principal_liability: u64, pub principal_deployed: u64, pub realized_reward_available: u64, pub total_rewards_distributed: u64, pub total_treasury_distributed: u64, pub participant_count: u32, pub next_draw_id: u64, pub draw_state: DrawState, pub bump: u8 }
#[account]
#[derive(InitSpace)]
pub struct Participant { pub pool: Pubkey, pub owner: Pubkey, pub principal: u64, pub withdrawn_principal: u64, pub rewards_won: u64, pub eligible_since: i64, pub bump: u8 }
#[account]
#[derive(InitSpace)]
pub struct PrizeDraw { pub pool: Pubkey, pub draw_id: u64, pub cutoff_at: i64, pub reward_amount: u64, pub winner_amount: u64, pub treasury_amount: u64, pub winner: Pubkey, pub snapshot_total_weight: u64, pub snapshot_entry_count: u32, pub snapshot_frozen: bool, pub randomness_request: Pubkey, pub randomness_seed: [u8; 32], pub state: DrawState, pub winner_claimed: bool, pub treasury_claimed: bool, pub bump: u8 }
#[account]
#[derive(InitSpace)]
pub struct DrawEntry { pub draw: Pubkey, pub participant: Pubkey, pub owner: Pubkey, pub weight: u64, pub range_start: u64, pub range_end: u64, pub bump: u8 }

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum StrategyKind { Kamino, Drift, ProjectZero }
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum WeightModel { EqualEligible, PrincipalWeighted, RecoveredActivityWeighted }
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum DrawState { Idle, Finalizing, Claimable, Complete }
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq)]
pub enum RewardSource { Manual, RealizedYield }

fn expected_protocol(kind: StrategyKind) -> Pubkey { match kind { StrategyKind::Kamino => KAMINO_LEND_PROGRAM, StrategyKind::Drift => DRIFT_PROGRAM, StrategyKind::ProjectZero => PROJECT_ZERO_PROGRAM } }
fn validate_usdc_mint(mint: &Account<Mint>) -> Result<()> { require_keys_eq!(mint.key(), NATIVE_USDC_MINT, PrizeError::WrongMint); require!(mint.decimals == USDC_DECIMALS, PrizeError::WrongDecimals); Ok(()) }
fn split_reward(amount: u64) -> Result<(u64, u64)> { let winner = amount.checked_mul(WINNER_BPS).ok_or(PrizeError::ArithmeticOverflow)?.checked_div(BASIS_POINTS).ok_or(PrizeError::ArithmeticOverflow)?; Ok((winner, amount.checked_sub(winner).ok_or(PrizeError::ArithmeticOverflow)?)) }
fn participant_is_eligible(pool: &PrizePool, participant: &Participant, now: i64) -> bool { participant.principal >= pool.minimum_principal && now.saturating_sub(participant.eligible_since) >= pool.holding_period_seconds }
fn participant_weight(pool: &PrizePool, participant: &Participant) -> Result<u64> {
    match pool.weight_model {
        WeightModel::EqualEligible => Ok(1),
        WeightModel::PrincipalWeighted => Ok(participant.principal),
        WeightModel::RecoveredActivityWeighted => err!(PrizeError::UnsupportedWeightModel),
    }
}
fn unbiased_weighted_offset(randomness: &[u8; 64], total_weight: u64) -> Result<u64> {
    require!(total_weight > 0, PrizeError::EmptySnapshot);
    // Rejection sampling avoids modulo bias. Eight independent u64 chunks are
    // available from ORAO's 64-byte fulfilled randomness.
    let zone = u64::MAX - (u64::MAX % total_weight);
    for chunk in randomness.chunks_exact(8) {
        let value = u64::from_le_bytes(chunk.try_into().map_err(|_| error!(PrizeError::InvalidRandomness))?);
        if value < zone { return Ok(value % total_weight); }
    }
    err!(PrizeError::RandomnessRejected)
}
fn draw_entry_contains(entry: &DrawEntry, offset: u64) -> bool { entry.range_start <= offset && offset < entry.range_end }
#[derive(Clone, Copy)]
struct AdapterRandomnessReceipt {
    draw: Pubkey,
    request: Pubkey,
    seed: [u8; 32],
    randomness: [u8; 64],
}

fn parse_randomness_receipt(account: &UncheckedAccount) -> Result<AdapterRandomnessReceipt> {
    let data = account.try_borrow_data()?;
    const REQUIRED: usize = 8 + 32 + 32 + 32 + 64 + 8 + 1;
    require!(data.len() >= REQUIRED, PrizeError::WrongRandomnessReceipt);
    require!(data[..8] == VRF_RECEIPT_DISCRIMINATOR, PrizeError::WrongRandomnessReceipt);
    let mut cursor = 8usize;
    let read32 = |data: &[u8], cursor: &mut usize| -> Result<[u8; 32]> {
        let end = cursor.checked_add(32).ok_or(PrizeError::ArithmeticOverflow)?;
        let bytes: [u8; 32] = data.get(*cursor..end).ok_or(PrizeError::WrongRandomnessReceipt)?.try_into().map_err(|_| error!(PrizeError::WrongRandomnessReceipt))?;
        *cursor = end;
        Ok(bytes)
    };
    let draw = Pubkey::new_from_array(read32(&data, &mut cursor)?);
    let request = Pubkey::new_from_array(read32(&data, &mut cursor)?);
    let seed = read32(&data, &mut cursor)?;
    let end = cursor.checked_add(64).ok_or(PrizeError::ArithmeticOverflow)?;
    let randomness: [u8; 64] = data.get(cursor..end).ok_or(PrizeError::WrongRandomnessReceipt)?.try_into().map_err(|_| error!(PrizeError::WrongRandomnessReceipt))?;
    Ok(AdapterRandomnessReceipt { draw, request, seed, randomness })
}


fn assert_idle_principal_solvency(pool: &PrizePool, vault: &TokenAccount) -> Result<()> { let assets = vault.amount.checked_add(pool.principal_deployed).ok_or(PrizeError::ArithmeticOverflow)?; require!(assets >= pool.total_principal_liability, PrizeError::PrincipalInsolvent); Ok(()) }

fn transfer_from_pool<'info>(pool: &Account<'info, PrizePool>, from: &Account<'info, TokenAccount>, mint: &Account<'info, Mint>, to: &Account<'info, TokenAccount>, token_program: &Program<'info, Token>, amount: u64) -> Result<()> {
    let pool_id = pool.pool_id.to_le_bytes();
    let bump = [pool.bump];
    let signer: &[&[u8]] = &[b"pool", pool.authority.as_ref(), pool_id.as_ref(), bump.as_ref()];
    token::transfer_checked(CpiContext::new_with_signer(token_program.key(), TransferChecked { from: from.to_account_info(), mint: mint.to_account_info(), to: to.to_account_info(), authority: pool.to_account_info() }, &[signer]), amount, USDC_DECIMALS)
}

#[event] pub struct PoolCreated { pub pool: Pubkey, pub authority: Pubkey, pub pool_id: u64 }
#[event] pub struct ParticipantJoined { pub pool: Pubkey, pub participant: Pubkey, pub owner: Pubkey }
#[event] pub struct PrincipalDeposited { pub pool: Pubkey, pub owner: Pubkey, pub amount: u64, pub principal_after: u64 }
#[event] pub struct PrincipalWithdrawn { pub pool: Pubkey, pub owner: Pubkey, pub amount: u64, pub principal_after: u64 }
#[event] pub struct RewardFunded { pub pool: Pubkey, pub funder: Pubkey, pub amount: u64, pub source: RewardSource }
#[event] pub struct DrawStarted { pub pool: Pubkey, pub draw: Pubkey, pub draw_id: u64, pub reward_amount: u64, pub cutoff_at: i64 }
#[event] pub struct DrawEntryRegistered { pub draw: Pubkey, pub owner: Pubkey, pub weight: u64, pub range_start: u64, pub range_end: u64 }
#[event] pub struct RandomnessRequested { pub draw: Pubkey, pub request: Pubkey, pub seed: [u8; 32] }
#[event] pub struct DrawSnapshotFrozen { pub draw: Pubkey, pub entry_count: u32, pub total_weight: u64 }
#[event] pub struct DrawFinalized { pub pool: Pubkey, pub draw: Pubkey, pub winner: Pubkey, pub solo: bool }
#[event] pub struct WinnerRewardClaimed { pub pool: Pubkey, pub draw: Pubkey, pub winner: Pubkey, pub amount: u64 }
#[event] pub struct TreasuryRewardClaimed { pub pool: Pubkey, pub draw: Pubkey, pub amount: u64 }
#[event] pub struct DrawCompleted { pub pool: Pubkey, pub draw: Pubkey, pub draw_id: u64 }

#[error_code]
pub enum PrizeError {
    #[msg("Amount must be greater than zero")] ZeroAmount,
    #[msg("Only Circle-issued native Solana USDC is accepted")] WrongMint,
    #[msg("USDC must use six decimals")] WrongDecimals,
    #[msg("Signer is not authorized")] Unauthorized,
    #[msg("Invalid registry version")] InvalidVersion,
    #[msg("Allocation must be valid and registry allocations cannot exceed 100%")] InvalidAllocation,
    #[msg("The supplied protocol program is not approved for this strategy kind")] WrongProtocol,
    #[msg("Strategy market and reserve must be explicitly configured")] InvalidStrategyAccount,
    #[msg("Arithmetic overflow or underflow")] ArithmeticOverflow,
    #[msg("The supplied vault is not the configured pool vault")] WrongVault,
    #[msg("The supplied account belongs to a different pool")] WrongPool,
    #[msg("The supplied treasury account is not configured for this pool")] WrongTreasury,
    #[msg("A draw is already in progress")] DrawInProgress,
    #[msg("Principal balance is insufficient")] InsufficientPrincipal,
    #[msg("Underlying liquidity cannot currently satisfy this withdrawal")] WithdrawalConstrained,
    #[msg("Principal assets do not cover participant liabilities")] PrincipalInsolvent,
    #[msg("Realized reward balance is insufficient")] InsufficientReward,
    #[msg("Draw ID is not the next sequential ID")] WrongDrawId,
    #[msg("Draw cutoff has not been reached")] CutoffNotReached,
    #[msg("Draw cutoff must not be in the past when a draw is started")] InvalidCutoff,
    #[msg("This instruction requires exactly one participant")] NotSoloPool,
    #[msg("This instruction requires a multi-user pool")] NotMultiPool,
    #[msg("Participant is not eligible for this draw")] NotEligible,
    #[msg("Draw is in the wrong state")] WrongDrawState,
    #[msg("This allocation has already been claimed")] AlreadyClaimed,
    #[msg("All allocations must be claimed before completing the draw")] UnclaimedAllocation,
    #[msg("Holding period cannot be negative")] InvalidHoldingPeriod,
    #[msg("The draw participant snapshot is already frozen")] SnapshotFrozen,
    #[msg("The draw participant snapshot must be frozen first")] SnapshotNotFrozen,
    #[msg("The draw snapshot registration window is closed")] SnapshotClosed,
    #[msg("The draw snapshot has no eligible entries")] EmptySnapshot,
    #[msg("This weight model is not yet verifiable on chain")] UnsupportedWeightModel,
    #[msg("Fulfilled randomness bytes are invalid")] InvalidRandomness,
    #[msg("Randomness samples fell outside the unbiased acceptance zone")] RandomnessRejected,
    #[msg("Randomness was already requested for this draw")] RandomnessAlreadyRequested,
    #[msg("Randomness receipt is not owned by the approved StashPot VRF adapter")] WrongRandomnessAdapter,
    #[msg("Randomness receipt does not match this draw/request/seed")] WrongRandomnessReceipt,
    #[msg("Submitted draw entry does not contain the selected weighted offset")] WrongDrawEntry,
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn reward_split_preserves_total() { let (winner, treasury) = split_reward(5_000_000).unwrap(); assert_eq!(winner, 4_250_000); assert_eq!(treasury, 750_000); assert_eq!(winner + treasury, 5_000_000); }
    #[test] fn tiny_reward_rounding_never_exceeds_reward() { for amount in 1..100 { let (winner, treasury) = split_reward(amount).unwrap(); assert_eq!(winner + treasury, amount); } }
    #[test] fn weighted_offset_is_bounded_and_entry_ranges_are_half_open() { let r = [7u8; 64]; let offset = unbiased_weighted_offset(&r, 100).unwrap(); assert!(offset < 100); let e = DrawEntry { draw: Pubkey::default(), participant: Pubkey::default(), owner: Pubkey::default(), weight: 10, range_start: 20, range_end: 30, bump: 1 }; assert!(draw_entry_contains(&e, 20)); assert!(draw_entry_contains(&e, 29)); assert!(!draw_entry_contains(&e, 30)); }
    #[test] fn approved_programs_are_fixed_by_kind() { assert_eq!(expected_protocol(StrategyKind::Kamino), KAMINO_LEND_PROGRAM); assert_eq!(expected_protocol(StrategyKind::Drift), DRIFT_PROGRAM); assert_eq!(expected_protocol(StrategyKind::ProjectZero), PROJECT_ZERO_PROGRAM); }
}
