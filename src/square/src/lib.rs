use borsh::{BorshDeserialize, BorshSerialize};

use solana_program::{
    account_info::{next_account_info, AccountInfo},
    entrypoint,
    entrypoint::ProgramResult,
    msg,
    program_error::ProgramError,
    pubkey::Pubkey,
};

#[derive(BorshSerialize, BorshDeserialize, Debug)]
pub struct MathStuffSquare {
    pub square : u32,
}

entrypoint!(process_instruction);

fn process_instruction(
    program_id: &Pubkey,
    accounts: &[AccountInfo],
    _instruction_data: &[u8],
) -> ProgramResult {

    msg!("Hello Solana! (from Rust!)");


    // Iterating accounts is safer than indexing
    let accounts_iter = &mut accounts.iter();

    // Get the account to say hello to
    let account = next_account_info(accounts_iter)?;

    // The account must be owned by the program in order to modify its data
    if account.owner != program_id {
        msg!("Greeted account does not have the correct program id");
        return Err(ProgramError::IncorrectProgramId);
    }

    msg!("Debug output:");
    msg!("Account Id: {}", account.key);
    msg!("Executable?: {}", account.executable);
    msg!("Lamports: {:#?}", account.lamports);
    msg!("Debug output complete.");

    msg!("Adding 1 to sum...");

    let mut math_stuff = MathStuffSquare::try_from_slice(&account.data.borrow())?;
    math_stuff.square += 1;
    math_stuff.serialize(&mut &mut account.data.borrow_mut()[..])?;

    msg!("Current square is now: {}", math_stuff.square);



    Ok(())
}
