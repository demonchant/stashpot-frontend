use anchor_lang::prelude::*;
use orao_solana_vrf::{self, RandomnessAccountData, RANDOMNESS_ACCOUNT_SEED};

declare_id!("AtRDA6ABdzQRiJcBu4yCdCc4XAqZ3dwWx9uH8XatWLMS");
pub const STASHPOT_PRIZE_PROGRAM: Pubkey = pubkey!("3LZnxEiTTGpfVQNHzBL683iFaspkYyxreyzMQEUqRqMj");

#[program]
pub mod stashpot_vrf_adapter {
    use super::*;

    pub fn request_randomness(ctx: Context<RequestRandomness>, seed: [u8; 32]) -> Result<()> {
        require!(seed != [0u8; 32], VrfAdapterError::InvalidSeed);
        let expected_authority = Pubkey::find_program_address(
            &[b"vrf-authority", ctx.accounts.pool.key().as_ref()],
            &STASHPOT_PRIZE_PROGRAM,
        ).0;
        require_keys_eq!(ctx.accounts.prize_authority.key(), expected_authority, VrfAdapterError::WrongPrizeAuthority);
        let state = &mut ctx.accounts.state;
        state.draw = ctx.accounts.draw.key();
        state.requester = ctx.accounts.requester.key();
        state.request = ctx.accounts.request.key();
        state.seed = seed;
        state.requested_at = Clock::get()?.unix_timestamp;
        state.fulfilled = false;
        state.bump = ctx.bumps.state;

        let cpi_accounts = orao_solana_vrf::cpi::accounts::RequestV2 {
            payer: ctx.accounts.requester.to_account_info(),
            network_state: ctx.accounts.network_state.to_account_info(),
            treasury: ctx.accounts.treasury.to_account_info(),
            request: ctx.accounts.request.to_account_info(),
            system_program: ctx.accounts.system_program.to_account_info(),
        };
        let cpi_ctx = CpiContext::new(ctx.accounts.vrf.to_account_info(), cpi_accounts);
        orao_solana_vrf::cpi::request_v2(cpi_ctx, seed)?;
        Ok(())
    }

    pub fn publish_fulfilled_randomness(ctx: Context<PublishFulfilledRandomness>) -> Result<()> {
        require!(!ctx.accounts.state.fulfilled, VrfAdapterError::AlreadyFulfilled);
        require_keys_eq!(ctx.accounts.state.request, ctx.accounts.request.key(), VrfAdapterError::WrongRequest);
        require_keys_eq!(*ctx.accounts.request.owner, orao_solana_vrf::ID, VrfAdapterError::WrongVrfOwner);

        let data = ctx.accounts.request.try_borrow_data()?;
        let mut slice: &[u8] = &data;
        let decoded = RandomnessAccountData::try_deserialize(&mut slice)
            .map_err(|_| error!(VrfAdapterError::InvalidRandomnessAccount))?;
        let randomness = decoded.fulfilled_randomness().ok_or(VrfAdapterError::NotFulfilled)?;

        let receipt = &mut ctx.accounts.receipt;
        receipt.draw = ctx.accounts.state.draw;
        receipt.request = ctx.accounts.request.key();
        receipt.seed = ctx.accounts.state.seed;
        receipt.randomness = *randomness;
        receipt.fulfilled_at = Clock::get()?.unix_timestamp;
        receipt.bump = ctx.bumps.receipt;
        ctx.accounts.state.fulfilled = true;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(seed: [u8; 32])]
pub struct RequestRandomness<'info> {
    #[account(mut)] pub requester: Signer<'info>,
    /// CHECK: StashPot PrizePool identity used only for PDA derivation.
    pub pool: UncheckedAccount<'info>,
    /// CHECK: Must be the StashPot prize program PDA and must sign through CPI.
    pub prize_authority: Signer<'info>,
    /// CHECK: StashPot PrizeDraw identity; no data is trusted from this account.
    pub draw: UncheckedAccount<'info>,
    #[account(init, payer = requester, space = 8 + VrfRequestState::INIT_SPACE, seeds = [b"vrf-state", draw.key().as_ref()], bump)]
    pub state: Account<'info, VrfRequestState>,
    /// CHECK: ORAO request PDA derived by the ORAO program.
    #[account(mut, seeds = [RANDOMNESS_ACCOUNT_SEED, seed.as_ref()], bump, seeds::program = orao_solana_vrf::ID)]
    pub request: UncheckedAccount<'info>,
    /// CHECK: ORAO treasury is validated by ORAO during CPI.
    #[account(mut)] pub treasury: UncheckedAccount<'info>,
    /// CHECK: ORAO network state PDA; ORAO validates its contents.
    #[account(mut)] pub network_state: UncheckedAccount<'info>,
    pub vrf: Program<'info, orao_solana_vrf::program::OraoVrf>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PublishFulfilledRandomness<'info> {
    #[account(mut, has_one = request @ VrfAdapterError::WrongRequest, seeds = [b"vrf-state", state.draw.as_ref()], bump = state.bump)]
    pub state: Account<'info, VrfRequestState>,
    /// CHECK: owner + stored request key + ORAO deserialization are verified in the handler.
    pub request: UncheckedAccount<'info>,
    #[account(init, payer = payer, space = 8 + RandomnessReceipt::INIT_SPACE, seeds = [b"receipt", state.draw.as_ref()], bump)]
    pub receipt: Account<'info, RandomnessReceipt>,
    #[account(mut)] pub payer: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct VrfRequestState {
    pub draw: Pubkey,
    pub requester: Pubkey,
    pub request: Pubkey,
    pub seed: [u8; 32],
    pub requested_at: i64,
    pub fulfilled: bool,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct RandomnessReceipt {
    pub draw: Pubkey,
    pub request: Pubkey,
    pub seed: [u8; 32],
    pub randomness: [u8; 64],
    pub fulfilled_at: i64,
    pub bump: u8,
}

#[error_code]
pub enum VrfAdapterError {
    #[msg("Randomness seed cannot be zero")] InvalidSeed,
    #[msg("Randomness has already been published")] AlreadyFulfilled,
    #[msg("Wrong ORAO randomness request account")] WrongRequest,
    #[msg("Randomness request is not owned by ORAO") ] WrongVrfOwner,
    #[msg("Could not decode ORAO randomness account")] InvalidRandomnessAccount,
    #[msg("ORAO randomness request is not fulfilled yet")] NotFulfilled,
    #[msg("Request was not authorized by the StashPot Prize Savings program PDA")] WrongPrizeAuthority,
}
