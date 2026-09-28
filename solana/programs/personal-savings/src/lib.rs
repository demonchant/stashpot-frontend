use anchor_lang::prelude::*;
use anchor_lang::solana_program::pubkey;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, CloseAccount, Mint, Token, TokenAccount, TransferChecked};

declare_id!("6uP6Yz7GLmz6JciwSHRTbGcfPeJybUVdiFXzYF6A4pxi");

pub const NATIVE_USDC_MINT: Pubkey = pubkey!("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
pub const USDC_DECIMALS: u8 = 6;

#[program]
pub mod personal_savings {
    use super::*;

    pub fn create_pot(ctx: Context<CreatePot>, pot_id: u64) -> Result<()> {
        validate_usdc_mint(&ctx.accounts.mint)?;
        let now = Clock::get()?.unix_timestamp;
        let pot = &mut ctx.accounts.pot;
        pot.owner = ctx.accounts.owner.key();
        pot.mint = ctx.accounts.mint.key();
        pot.vault = ctx.accounts.vault.key();
        pot.pot_id = pot_id;
        pot.principal = 0;
        pot.created_at = now;
        pot.bump = ctx.bumps.pot;
        emit!(PotCreated {
            pot: pot.key(),
            owner: pot.owner,
            pot_id,
            created_at: now,
        });
        Ok(())
    }

    pub fn deposit(ctx: Context<UsePot>, amount: u64) -> Result<()> {
        require!(amount > 0, SavingsError::ZeroAmount);
        validate_usdc_mint(&ctx.accounts.mint)?;
        let next = checked_add(ctx.accounts.pot.principal, amount)?;

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

        ctx.accounts.pot.principal = next;
        emit!(SavingsDeposited {
            pot: ctx.accounts.pot.key(),
            owner: ctx.accounts.owner.key(),
            amount,
            principal_after: next,
        });
        Ok(())
    }

    pub fn withdraw(ctx: Context<UsePot>, amount: u64) -> Result<()> {
        require!(amount > 0, SavingsError::ZeroAmount);
        validate_usdc_mint(&ctx.accounts.mint)?;
        let remaining = checked_sub(ctx.accounts.pot.principal, amount)?;
        require!(ctx.accounts.vault.amount >= amount, SavingsError::VaultInsolvent);

        let pot_id = ctx.accounts.pot.pot_id.to_le_bytes();
        let bump = [ctx.accounts.pot.bump];
        let signer: &[&[u8]] = &[
            b"pot",
            ctx.accounts.owner.key.as_ref(),
            pot_id.as_ref(),
            bump.as_ref(),
        ];
        token::transfer_checked(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.key(),
                TransferChecked {
                    from: ctx.accounts.vault.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.owner_token.to_account_info(),
                    authority: ctx.accounts.pot.to_account_info(),
                },
                &[signer],
            ),
            amount,
            USDC_DECIMALS,
        )?;

        ctx.accounts.pot.principal = remaining;
        emit!(SavingsWithdrawn {
            pot: ctx.accounts.pot.key(),
            owner: ctx.accounts.owner.key(),
            amount,
            principal_after: remaining,
        });
        Ok(())
    }

    pub fn close_pot(ctx: Context<ClosePot>) -> Result<()> {
        require!(ctx.accounts.pot.principal == 0, SavingsError::OutstandingPrincipal);
        require!(ctx.accounts.vault.amount == 0, SavingsError::VaultNotEmpty);

        let pot_id = ctx.accounts.pot.pot_id.to_le_bytes();
        let bump = [ctx.accounts.pot.bump];
        let signer: &[&[u8]] = &[
            b"pot",
            ctx.accounts.owner.key.as_ref(),
            pot_id.as_ref(),
            bump.as_ref(),
        ];
        token::close_account(CpiContext::new_with_signer(
            ctx.accounts.token_program.key(),
            CloseAccount {
                account: ctx.accounts.vault.to_account_info(),
                destination: ctx.accounts.owner.to_account_info(),
                authority: ctx.accounts.pot.to_account_info(),
            },
            &[signer],
        ))?;
        emit!(PotClosed {
            pot: ctx.accounts.pot.key(),
            owner: ctx.accounts.owner.key(),
        });
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(pot_id: u64)]
pub struct CreatePot<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(constraint = mint.key() == NATIVE_USDC_MINT @ SavingsError::WrongMint)]
    pub mint: Account<'info, Mint>,
    #[account(
        init,
        payer = owner,
        space = 8 + SavingsPot::INIT_SPACE,
        seeds = [b"pot", owner.key().as_ref(), &pot_id.to_le_bytes()],
        bump
    )]
    pub pot: Account<'info, SavingsPot>,
    #[account(
        init,
        payer = owner,
        associated_token::mint = mint,
        associated_token::authority = pot,
        associated_token::token_program = token_program
    )]
    pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UsePot<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        mut,
        has_one = owner @ SavingsError::Unauthorized,
        has_one = mint @ SavingsError::WrongMint,
        has_one = vault @ SavingsError::WrongVault,
        seeds = [b"pot", owner.key().as_ref(), &pot.pot_id.to_le_bytes()],
        bump = pot.bump
    )]
    pub pot: Account<'info, SavingsPot>,
    #[account(constraint = mint.key() == NATIVE_USDC_MINT @ SavingsError::WrongMint)]
    pub mint: Account<'info, Mint>,
    #[account(
        mut,
        token::mint = mint,
        token::authority = owner,
        token::token_program = token_program
    )]
    pub owner_token: Account<'info, TokenAccount>,
    #[account(
        mut,
        token::mint = mint,
        token::authority = pot,
        token::token_program = token_program
    )]
    pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClosePot<'info> {
    #[account(mut)]
    pub owner: Signer<'info>,
    #[account(
        mut,
        close = owner,
        has_one = owner @ SavingsError::Unauthorized,
        has_one = vault @ SavingsError::WrongVault,
        seeds = [b"pot", owner.key().as_ref(), &pot.pot_id.to_le_bytes()],
        bump = pot.bump
    )]
    pub pot: Account<'info, SavingsPot>,
    #[account(mut, token::authority = pot)]
    pub vault: Account<'info, TokenAccount>,
    pub token_program: Program<'info, Token>,
}

#[account]
#[derive(InitSpace)]
pub struct SavingsPot {
    pub owner: Pubkey,
    pub mint: Pubkey,
    pub vault: Pubkey,
    pub pot_id: u64,
    pub principal: u64,
    pub created_at: i64,
    pub bump: u8,
}

fn validate_usdc_mint(mint: &Account<Mint>) -> Result<()> {
    require_keys_eq!(mint.key(), NATIVE_USDC_MINT, SavingsError::WrongMint);
    require!(mint.decimals == USDC_DECIMALS, SavingsError::WrongDecimals);
    Ok(())
}

fn checked_add(current: u64, amount: u64) -> Result<u64> {
    current.checked_add(amount).ok_or_else(|| error!(SavingsError::ArithmeticOverflow))
}

fn checked_sub(current: u64, amount: u64) -> Result<u64> {
    current.checked_sub(amount).ok_or_else(|| error!(SavingsError::InsufficientPrincipal))
}

#[event]
pub struct PotCreated { pub pot: Pubkey, pub owner: Pubkey, pub pot_id: u64, pub created_at: i64 }
#[event]
pub struct SavingsDeposited { pub pot: Pubkey, pub owner: Pubkey, pub amount: u64, pub principal_after: u64 }
#[event]
pub struct SavingsWithdrawn { pub pot: Pubkey, pub owner: Pubkey, pub amount: u64, pub principal_after: u64 }
#[event]
pub struct PotClosed { pub pot: Pubkey, pub owner: Pubkey }

#[error_code]
pub enum SavingsError {
    #[msg("Amount must be greater than zero")] ZeroAmount,
    #[msg("Only Circle-issued native Solana USDC is accepted")] WrongMint,
    #[msg("USDC must use six decimals")] WrongDecimals,
    #[msg("The signer does not own this savings pot")] Unauthorized,
    #[msg("The supplied vault is not the pot vault")] WrongVault,
    #[msg("Arithmetic overflow")] ArithmeticOverflow,
    #[msg("Withdrawal exceeds recorded principal")] InsufficientPrincipal,
    #[msg("Vault assets cannot satisfy this withdrawal")] VaultInsolvent,
    #[msg("Withdraw all principal before closing the pot")] OutstandingPrincipal,
    #[msg("The pot vault must be empty before closing")] VaultNotEmpty,
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn balance_math_rejects_overflow_and_overdraw() {
        assert!(checked_add(u64::MAX, 1).is_err());
        assert!(checked_sub(4, 5).is_err());
        assert_eq!(checked_add(4, 5).unwrap(), 9);
        assert_eq!(checked_sub(9, 5).unwrap(), 4);
    }
}
