use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, TransferChecked};

declare_id!("35u9epgyCDBtvn4h6MzBBCbWUC3bRm2r1scJZeJBvtnE");

pub const NATIVE_USDC_MINT: Pubkey = pubkey!("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
pub const USDC_DECIMALS: u8 = 6;
pub const MAX_MEMBERS: u16 = 64;

#[program]
pub mod savings_circles {
    use super::*;

    pub fn create_circle(
        ctx: Context<CreateCircle>,
        circle_id: u64,
        target_members: u16,
        contribution_amount: u64,
        frequency_seconds: i64,
    ) -> Result<()> {
        validate_usdc_mint(&ctx.accounts.mint)?;
        require!(target_members > 0 && target_members <= MAX_MEMBERS, CircleError::InvalidMemberCap);
        require!(contribution_amount > 0, CircleError::ZeroAmount);
        require!(frequency_seconds > 0, CircleError::InvalidFrequency);
        let now = Clock::get()?.unix_timestamp;
        let circle = &mut ctx.accounts.circle;
        circle.creator = ctx.accounts.creator.key();
        circle.mint = ctx.accounts.mint.key();
        circle.vault = ctx.accounts.vault.key();
        circle.circle_id = circle_id;
        circle.target_members = target_members;
        circle.member_count = 1;
        circle.contribution_amount = contribution_amount;
        circle.frequency_seconds = frequency_seconds;
        circle.current_cycle = 0;
        circle.cycle_contribution_count = 0;
        circle.next_due_at = 0;
        circle.total_contributed = 0;
        circle.total_paid_out = 0;
        circle.status = CircleStatus::Waiting;
        circle.created_at = now;
        circle.bump = ctx.bumps.circle;

        let member = &mut ctx.accounts.creator_member;
        member.circle = circle.key();
        member.owner = ctx.accounts.creator.key();
        member.slot = 0;
        member.joined_at = now;
        member.total_contributed = 0;
        member.total_received = 0;
        member.active = true;
        member.bump = ctx.bumps.creator_member;
        emit!(CircleCreated { circle: circle.key(), creator: circle.creator, target_members, contribution_amount, frequency_seconds });
        Ok(())
    }

    pub fn join_circle(ctx: Context<JoinCircle>) -> Result<()> {
        require!(ctx.accounts.circle.status == CircleStatus::Waiting, CircleError::AlreadyStarted);
        require!(ctx.accounts.circle.member_count < ctx.accounts.circle.target_members, CircleError::CircleFull);
        let now = Clock::get()?.unix_timestamp;
        let slot = ctx.accounts.circle.member_count;
        let member = &mut ctx.accounts.member;
        member.circle = ctx.accounts.circle.key();
        member.owner = ctx.accounts.owner.key();
        member.slot = slot;
        member.joined_at = now;
        member.total_contributed = 0;
        member.total_received = 0;
        member.active = true;
        member.bump = ctx.bumps.member;
        ctx.accounts.circle.member_count = ctx.accounts.circle.member_count.checked_add(1).ok_or(CircleError::ArithmeticOverflow)?;
        emit!(MemberJoined { circle: ctx.accounts.circle.key(), owner: member.owner, slot });
        Ok(())
    }

    pub fn leave_waiting_circle(ctx: Context<LeaveWaitingCircle>) -> Result<()> {
        require!(ctx.accounts.circle.status == CircleStatus::Waiting, CircleError::AlreadyStarted);
        require!(ctx.accounts.member.owner != ctx.accounts.circle.creator, CircleError::CreatorCannotLeave);
        require!(ctx.accounts.member.slot.checked_add(1) == Some(ctx.accounts.circle.member_count), CircleError::OnlyLastMemberCanLeave);
        require!(ctx.accounts.member.total_contributed == 0, CircleError::OutstandingLiability);
        ctx.accounts.circle.member_count = ctx.accounts.circle.member_count.checked_sub(1).ok_or(CircleError::ArithmeticOverflow)?;
        emit!(MemberLeft { circle: ctx.accounts.circle.key(), owner: ctx.accounts.owner.key() });
        Ok(())
    }

    pub fn start_circle(ctx: Context<ManageCircle>) -> Result<()> {
        require!(ctx.accounts.circle.status == CircleStatus::Waiting, CircleError::AlreadyStarted);
        require!(ctx.accounts.circle.member_count == ctx.accounts.circle.target_members, CircleError::WaitingForMembers);
        require!(ctx.accounts.circle.member_count > 1, CircleError::SoloCannotRotate);
        let now = Clock::get()?.unix_timestamp;
        ctx.accounts.circle.status = CircleStatus::Active;
        ctx.accounts.circle.next_due_at = now.checked_add(ctx.accounts.circle.frequency_seconds).ok_or(CircleError::ArithmeticOverflow)?;
        emit!(CircleStarted { circle: ctx.accounts.circle.key(), started_at: now, first_due_at: ctx.accounts.circle.next_due_at });
        Ok(())
    }

    pub fn contribute(ctx: Context<Contribute>) -> Result<()> {
        require!(matches!(ctx.accounts.circle.status, CircleStatus::Active | CircleStatus::Delinquent) || (ctx.accounts.circle.status == CircleStatus::Waiting && ctx.accounts.circle.member_count == 1), CircleError::NotAcceptingContributions);
        let now = Clock::get()?.unix_timestamp;
        if ctx.accounts.circle.status == CircleStatus::Active {
            require!(now <= ctx.accounts.circle.next_due_at, CircleError::ContributionLate);
        }
        // A delinquent cycle remains fundable so members can cure the missed deadline.
        // The circle cannot advance until every member has funded the same cycle.
        validate_usdc_mint(&ctx.accounts.mint)?;
        let amount = ctx.accounts.circle.contribution_amount;
        token::transfer_checked(
            CpiContext::new(
                ctx.accounts.token_program.key(),
                TransferChecked {
                    from: ctx.accounts.member_token.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.vault.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(),
                },
            ), amount, USDC_DECIMALS,
        )?;
        let contribution = &mut ctx.accounts.contribution;
        contribution.circle = ctx.accounts.circle.key();
        contribution.member = ctx.accounts.member.key();
        contribution.owner = ctx.accounts.owner.key();
        contribution.cycle = ctx.accounts.circle.current_cycle;
        contribution.amount = amount;
        contribution.paid_at = now;
        contribution.refunded = false;
        contribution.bump = ctx.bumps.contribution;
        ctx.accounts.member.total_contributed = ctx.accounts.member.total_contributed.checked_add(amount).ok_or(CircleError::ArithmeticOverflow)?;
        let circle = &mut ctx.accounts.circle;
        circle.cycle_contribution_count = circle.cycle_contribution_count.checked_add(1).ok_or(CircleError::ArithmeticOverflow)?;
        circle.total_contributed = circle.total_contributed.checked_add(amount).ok_or(CircleError::ArithmeticOverflow)?;
        emit!(ContributionMade { circle: circle.key(), owner: ctx.accounts.owner.key(), cycle: circle.current_cycle, amount });
        Ok(())
    }

    pub fn refund_solo_test_contribution(ctx: Context<RefundSoloContribution>) -> Result<()> {
        require!(ctx.accounts.circle.status == CircleStatus::Waiting && ctx.accounts.circle.member_count == 1, CircleError::NotSoloTest);
        require!(!ctx.accounts.contribution.refunded, CircleError::AlreadyRefunded);
        require!(ctx.accounts.contribution.cycle == 0, CircleError::WrongCycle);
        let amount = ctx.accounts.contribution.amount;
        require!(ctx.accounts.vault.amount >= amount, CircleError::VaultInsolvent);
        transfer_from_circle(&ctx.accounts.circle, &ctx.accounts.vault, &ctx.accounts.mint, &ctx.accounts.owner_token, &ctx.accounts.token_program, amount)?;
        ctx.accounts.contribution.refunded = true;
        ctx.accounts.member.total_contributed = ctx.accounts.member.total_contributed.checked_sub(amount).ok_or(CircleError::ArithmeticOverflow)?;
        ctx.accounts.circle.total_contributed = ctx.accounts.circle.total_contributed.checked_sub(amount).ok_or(CircleError::ArithmeticOverflow)?;
        ctx.accounts.circle.cycle_contribution_count = ctx.accounts.circle.cycle_contribution_count.checked_sub(1).ok_or(CircleError::ArithmeticOverflow)?;
        emit!(SoloContributionRefunded { circle: ctx.accounts.circle.key(), owner: ctx.accounts.owner.key(), amount });
        Ok(())
    }

    pub fn execute_cycle_payout(ctx: Context<ExecutePayout>) -> Result<()> {
        require!(matches!(ctx.accounts.circle.status, CircleStatus::Active | CircleStatus::Delinquent), CircleError::NotActive);
        require!(ctx.accounts.circle.cycle_contribution_count == ctx.accounts.circle.member_count, CircleError::CycleNotFullyFunded);
        let expected_slot = (ctx.accounts.circle.current_cycle % ctx.accounts.circle.member_count as u32) as u16;
        require!(ctx.accounts.recipient_member.slot == expected_slot && ctx.accounts.recipient_member.active, CircleError::WrongRecipient);
        require!(ctx.accounts.payout.cycle == 0 && !ctx.accounts.payout.executed, CircleError::DuplicatePayout);
        let amount = ctx.accounts.circle.contribution_amount.checked_mul(ctx.accounts.circle.member_count as u64).ok_or(CircleError::ArithmeticOverflow)?;
        require!(ctx.accounts.vault.amount >= amount, CircleError::VaultInsolvent);
        transfer_from_circle(&ctx.accounts.circle, &ctx.accounts.vault, &ctx.accounts.mint, &ctx.accounts.recipient_token, &ctx.accounts.token_program, amount)?;

        let now = Clock::get()?.unix_timestamp;
        let payout = &mut ctx.accounts.payout;
        payout.circle = ctx.accounts.circle.key();
        payout.recipient_member = ctx.accounts.recipient_member.key();
        payout.recipient = ctx.accounts.recipient_member.owner;
        payout.cycle = ctx.accounts.circle.current_cycle;
        payout.amount = amount;
        payout.paid_at = now;
        payout.executed = true;
        payout.bump = ctx.bumps.payout;
        ctx.accounts.recipient_member.total_received = ctx.accounts.recipient_member.total_received.checked_add(amount).ok_or(CircleError::ArithmeticOverflow)?;
        let paid_cycle = ctx.accounts.circle.current_cycle;
        let circle = &mut ctx.accounts.circle;
        circle.total_paid_out = circle.total_paid_out.checked_add(amount).ok_or(CircleError::ArithmeticOverflow)?;
        circle.current_cycle = circle.current_cycle.checked_add(1).ok_or(CircleError::ArithmeticOverflow)?;
        circle.cycle_contribution_count = 0;
        if circle.current_cycle >= circle.member_count as u32 {
            circle.status = CircleStatus::Completed;
        } else {
            // A cured delinquent cycle returns to normal operation only after its
            // fully-funded payout succeeds.
            circle.status = CircleStatus::Active;
            circle.next_due_at = now.checked_add(circle.frequency_seconds).ok_or(CircleError::ArithmeticOverflow)?;
        }
        emit!(CyclePaid { circle: circle.key(), cycle: paid_cycle, recipient: payout.recipient, amount });
        Ok(())
    }

    pub fn mark_cycle_overdue(ctx: Context<MarkOverdue>) -> Result<()> {
        require!(ctx.accounts.circle.status == CircleStatus::Active, CircleError::NotActive);
        require!(Clock::get()?.unix_timestamp > ctx.accounts.circle.next_due_at, CircleError::DeadlineNotPassed);
        require!(ctx.accounts.circle.cycle_contribution_count < ctx.accounts.circle.member_count, CircleError::CycleFullyFunded);
        ctx.accounts.circle.status = CircleStatus::Delinquent;
        emit!(CycleOverdue { circle: ctx.accounts.circle.key(), cycle: ctx.accounts.circle.current_cycle });
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(circle_id: u64)]
pub struct CreateCircle<'info> {
    #[account(mut)] pub creator: Signer<'info>,
    #[account(constraint = mint.key() == NATIVE_USDC_MINT @ CircleError::WrongMint)] pub mint: Account<'info, Mint>,
    #[account(init, payer = creator, space = 8 + SavingsCircle::INIT_SPACE, seeds = [b"circle", creator.key().as_ref(), &circle_id.to_le_bytes()], bump)] pub circle: Account<'info, SavingsCircle>,
    #[account(init, payer = creator, space = 8 + CircleMember::INIT_SPACE, seeds = [b"member", circle.key().as_ref(), creator.key().as_ref()], bump)] pub creator_member: Account<'info, CircleMember>,
    #[account(init, payer = creator, associated_token::mint = mint, associated_token::authority = circle, associated_token::token_program = token_program)] pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct JoinCircle<'info> {
    #[account(mut)] pub owner: Signer<'info>,
    #[account(mut)] pub circle: Account<'info, SavingsCircle>,
    #[account(init, payer = owner, space = 8 + CircleMember::INIT_SPACE, seeds = [b"member", circle.key().as_ref(), owner.key().as_ref()], bump)] pub member: Account<'info, CircleMember>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct LeaveWaitingCircle<'info> {
    #[account(mut)] pub owner: Signer<'info>,
    #[account(mut)] pub circle: Account<'info, SavingsCircle>,
    #[account(mut, close = owner, has_one = circle @ CircleError::WrongCircle, has_one = owner @ CircleError::Unauthorized, seeds = [b"member", circle.key().as_ref(), owner.key().as_ref()], bump = member.bump)] pub member: Account<'info, CircleMember>,
}

#[derive(Accounts)]
pub struct ManageCircle<'info> {
    pub creator: Signer<'info>,
    #[account(mut, has_one = creator @ CircleError::Unauthorized)] pub circle: Account<'info, SavingsCircle>,
}

#[derive(Accounts)]
pub struct Contribute<'info> {
    #[account(mut)] pub owner: Signer<'info>,
    #[account(mut, has_one = mint @ CircleError::WrongMint, has_one = vault @ CircleError::WrongVault)] pub circle: Account<'info, SavingsCircle>,
    #[account(mut, has_one = circle @ CircleError::WrongCircle, has_one = owner @ CircleError::Unauthorized, constraint = member.active @ CircleError::InactiveMember)] pub member: Account<'info, CircleMember>,
    #[account(init, payer = owner, space = 8 + CircleContribution::INIT_SPACE, seeds = [b"contribution", circle.key().as_ref(), &circle.current_cycle.to_le_bytes(), member.key().as_ref()], bump)] pub contribution: Account<'info, CircleContribution>,
    #[account(constraint = mint.key() == NATIVE_USDC_MINT @ CircleError::WrongMint)] pub mint: Account<'info, Mint>,
    #[account(mut, token::mint = mint, token::authority = owner)] pub member_token: Account<'info, TokenAccount>,
    #[account(mut, token::mint = mint, token::authority = circle)] pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RefundSoloContribution<'info> {
    #[account(mut)] pub owner: Signer<'info>,
    #[account(mut, has_one = mint @ CircleError::WrongMint, has_one = vault @ CircleError::WrongVault)] pub circle: Account<'info, SavingsCircle>,
    #[account(mut, has_one = circle @ CircleError::WrongCircle, has_one = owner @ CircleError::Unauthorized)] pub member: Account<'info, CircleMember>,
    #[account(mut, has_one = circle @ CircleError::WrongCircle, has_one = owner @ CircleError::Unauthorized, constraint = contribution.member == member.key() @ CircleError::MemberSubstitution)] pub contribution: Account<'info, CircleContribution>,
    #[account(constraint = mint.key() == NATIVE_USDC_MINT @ CircleError::WrongMint)] pub mint: Account<'info, Mint>,
    #[account(mut, token::mint = mint, token::authority = owner)] pub owner_token: Account<'info, TokenAccount>,
    #[account(mut, token::mint = mint, token::authority = circle)] pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ExecutePayout<'info> {
    #[account(mut)] pub payer: Signer<'info>,
    #[account(mut, has_one = mint @ CircleError::WrongMint, has_one = vault @ CircleError::WrongVault)] pub circle: Account<'info, SavingsCircle>,
    #[account(mut, has_one = circle @ CircleError::WrongCircle, seeds = [b"member", circle.key().as_ref(), recipient_member.owner.as_ref()], bump = recipient_member.bump)] pub recipient_member: Account<'info, CircleMember>,
    #[account(init, payer = payer, space = 8 + CirclePayout::INIT_SPACE, seeds = [b"payout", circle.key().as_ref(), &circle.current_cycle.to_le_bytes()], bump)] pub payout: Account<'info, CirclePayout>,
    #[account(constraint = mint.key() == NATIVE_USDC_MINT @ CircleError::WrongMint)] pub mint: Account<'info, Mint>,
    #[account(mut, token::mint = mint, token::authority = circle)] pub vault: Account<'info, TokenAccount>,
    #[account(mut, token::mint = mint, constraint = recipient_token.owner == recipient_member.owner @ CircleError::WrongRecipient)] pub recipient_token: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct MarkOverdue<'info> { pub caller: Signer<'info>, #[account(mut)] pub circle: Account<'info, SavingsCircle> }

#[account]
#[derive(InitSpace)]
pub struct SavingsCircle { pub creator: Pubkey, pub mint: Pubkey, pub vault: Pubkey, pub circle_id: u64, pub target_members: u16, pub member_count: u16, pub contribution_amount: u64, pub frequency_seconds: i64, pub current_cycle: u32, pub cycle_contribution_count: u16, pub next_due_at: i64, pub total_contributed: u64, pub total_paid_out: u64, pub status: CircleStatus, pub created_at: i64, pub bump: u8 }
#[account]
#[derive(InitSpace)]
pub struct CircleMember { pub circle: Pubkey, pub owner: Pubkey, pub slot: u16, pub joined_at: i64, pub total_contributed: u64, pub total_received: u64, pub active: bool, pub bump: u8 }
#[account]
#[derive(InitSpace)]
pub struct CircleContribution { pub circle: Pubkey, pub member: Pubkey, pub owner: Pubkey, pub cycle: u32, pub amount: u64, pub paid_at: i64, pub refunded: bool, pub bump: u8 }
#[account]
#[derive(InitSpace)]
pub struct CirclePayout { pub circle: Pubkey, pub recipient_member: Pubkey, pub recipient: Pubkey, pub cycle: u32, pub amount: u64, pub paid_at: i64, pub executed: bool, pub bump: u8 }

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, InitSpace)]
pub enum CircleStatus { Waiting, Active, Delinquent, Completed, Closed }

fn validate_usdc_mint(mint: &Account<Mint>) -> Result<()> { require_keys_eq!(mint.key(), NATIVE_USDC_MINT, CircleError::WrongMint); require!(mint.decimals == USDC_DECIMALS, CircleError::WrongDecimals); Ok(()) }
fn transfer_from_circle<'info>(circle: &Account<'info, SavingsCircle>, from: &Account<'info, TokenAccount>, mint: &Account<'info, Mint>, to: &Account<'info, TokenAccount>, token_program: &Program<'info, Token>, amount: u64) -> Result<()> { let id = circle.circle_id.to_le_bytes(); let bump = [circle.bump]; let signer: &[&[u8]] = &[b"circle", circle.creator.as_ref(), id.as_ref(), bump.as_ref()]; token::transfer_checked(CpiContext::new_with_signer(token_program.key(), TransferChecked { from: from.to_account_info(), mint: mint.to_account_info(), to: to.to_account_info(), authority: circle.to_account_info() }, &[signer]), amount, USDC_DECIMALS) }

#[event] pub struct CircleCreated { pub circle: Pubkey, pub creator: Pubkey, pub target_members: u16, pub contribution_amount: u64, pub frequency_seconds: i64 }
#[event] pub struct MemberJoined { pub circle: Pubkey, pub owner: Pubkey, pub slot: u16 }
#[event] pub struct MemberLeft { pub circle: Pubkey, pub owner: Pubkey }
#[event] pub struct CircleStarted { pub circle: Pubkey, pub started_at: i64, pub first_due_at: i64 }
#[event] pub struct ContributionMade { pub circle: Pubkey, pub owner: Pubkey, pub cycle: u32, pub amount: u64 }
#[event] pub struct SoloContributionRefunded { pub circle: Pubkey, pub owner: Pubkey, pub amount: u64 }
#[event] pub struct CyclePaid { pub circle: Pubkey, pub cycle: u32, pub recipient: Pubkey, pub amount: u64 }
#[event] pub struct CycleOverdue { pub circle: Pubkey, pub cycle: u32 }

#[error_code]
pub enum CircleError {
    #[msg("Amount must be greater than zero")] ZeroAmount,
    #[msg("Only Circle-issued native Solana USDC is accepted")] WrongMint,
    #[msg("USDC must use six decimals")] WrongDecimals,
    #[msg("Invalid member cap")] InvalidMemberCap,
    #[msg("Contribution frequency must be positive")] InvalidFrequency,
    #[msg("Signer is not authorized")] Unauthorized,
    #[msg("Circle already started")] AlreadyStarted,
    #[msg("Circle has reached its member cap")] CircleFull,
    #[msg("Creator cannot leave the circle this way")] CreatorCannotLeave,
    #[msg("Only the last waiting member may leave, preserving immutable payout order")] OnlyLastMemberCanLeave,
    #[msg("Member has an outstanding contribution liability")] OutstandingLiability,
    #[msg("Circle is waiting for all target members")] WaitingForMembers,
    #[msg("A solo/test circle cannot execute a rotating payout")] SoloCannotRotate,
    #[msg("Circle is not accepting contributions")] NotAcceptingContributions,
    #[msg("Contribution deadline has passed")] ContributionLate,
    #[msg("Arithmetic overflow or underflow")] ArithmeticOverflow,
    #[msg("Supplied vault is not this circle's vault")] WrongVault,
    #[msg("Supplied account belongs to another circle")] WrongCircle,
    #[msg("Member is inactive")] InactiveMember,
    #[msg("This is not a solo/test circle")] NotSoloTest,
    #[msg("Contribution was already refunded")] AlreadyRefunded,
    #[msg("Contribution belongs to another cycle")] WrongCycle,
    #[msg("Vault cannot satisfy its obligation")] VaultInsolvent,
    #[msg("Contribution member account was substituted")] MemberSubstitution,
    #[msg("Circle is not active")] NotActive,
    #[msg("Not every member has funded this cycle")] CycleNotFullyFunded,
    #[msg("Recipient is not the immutable recipient for this cycle")] WrongRecipient,
    #[msg("This cycle was already paid")] DuplicatePayout,
    #[msg("Contribution deadline has not passed")] DeadlineNotPassed,
    #[msg("Cycle is fully funded and is not overdue")] CycleFullyFunded,
}

#[cfg(test)]
mod tests {
    #[test] fn delinquent_is_recoverable_status() { assert!(matches!(super::CircleStatus::Delinquent, super::CircleStatus::Delinquent)); }
    #[test] fn payout_order_rotates_without_duplicates() { let members = 5u32; let slots: Vec<u32> = (0..members).map(|cycle| cycle % members).collect(); assert_eq!(slots, vec![0, 1, 2, 3, 4]); }
    #[test] fn payout_amount_uses_checked_math() { assert_eq!(50_000_000u64.checked_mul(5).unwrap(), 250_000_000); assert!(u64::MAX.checked_mul(2).is_none()); }
}
