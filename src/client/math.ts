import {
  Keypair,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  SystemProgram,
  TransactionInstruction,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { createKeypairFromFile } from "./util";
import fs from "mz/fs";
import os from "os";
import path from "path";
import yaml from "yaml";

const CONFIG_FILE_PATH = path.resolve(
  os.homedir(),
  ".config",
  "solana",
  "cli",
  "config.yml"
);

let connection: Connection;
let localKeypair: Keypair;
let programKeypair: Keypair;
let programId: PublicKey;
let clientPubKey: PublicKey;

const PROGRAM_PATH = path.resolve(__dirname, "../../dist/program");

export async function connect() {
  connection = new Connection("https://api.devnet.solana.com", "confirmed");
  console.log("Suceessfully connected to Solana devnet!");
}

export async function getLocalAccount() {
  const configYml = await fs.readFile(CONFIG_FILE_PATH, { encoding: "utf8" });
  const keypairPath: string = await yaml.parse(configYml).keypair_path;
  localKeypair = await createKeypairFromFile(keypairPath);
  // const airdropRequest = await connection.requestAirdrop(
  //   localKeypair.publicKey,
  //   LAMPORTS_PER_SOL * 2
  // );
  // await connection.confirmTransaction(airdropRequest);

  console.log("Local account loaded successfully");
  console.log("Local account's address is: ");
  console.log(`    ${localKeypair.publicKey}`);
}

export async function getProgram(programmeName: string) {
  programKeypair = await createKeypairFromFile(
    path.join(PROGRAM_PATH, programmeName + "-keypair.json")
  );

  programId = programKeypair.publicKey;

  console.log(`we're going to ping the ${programmeName} program`);
  console.log("It's Program ID is ");
  console.log(`${programId.toBase58()}`);
}

export async function configureClientAccount(accountSpaceSize: number) {
  const SEED = "test1";
  clientPubKey = await PublicKey.createWithSeed(
    localKeypair.publicKey,
    SEED,
    programId
  );

  console.log(`For simplicity's sake, we've created an address using a seed.`);
  console.log(`That seed is just the string "test(num)".`);
  console.log(`The generated address is:`);
  console.log(`   ${clientPubKey.toBase58()}`);

  // Make sure it doesn't exist already.
  const clientAccount = await connection.getAccountInfo(clientPubKey);
  if (clientAccount === null) {
    console.log(`Looks like that account does not exist. Let's create it.`);

    const transaction = new Transaction().add(
      SystemProgram.createAccountWithSeed({
        fromPubkey: localKeypair.publicKey,
        basePubkey: localKeypair.publicKey,
        seed: SEED,
        newAccountPubkey: clientPubKey,
        lamports: LAMPORTS_PER_SOL,
        space: accountSpaceSize,
        programId,
      })
    );
    await sendAndConfirmTransaction(connection, transaction, [localKeypair]);

    console.log(`Client account created successfully.`);
  } else {
    console.log(`Looks like that account exists already. We can just use it.`);
  }
}

/*
Ping the program.
*/
export async function pingProgram(programName: string) {
  console.log(`All right, let's run it.`);
  console.log(`Pinging ${programName} program...`);

  const instruction = new TransactionInstruction({
    keys: [{ pubkey: clientPubKey, isSigner: false, isWritable: true }],
    programId,
    data: Buffer.alloc(0), // Empty instruction data
  });
  await sendAndConfirmTransaction(
    connection,
    new Transaction().add(instruction),
    [localKeypair]
  );

  console.log(instruction);

  console.log(
    `clientPubKey is ${clientPubKey}, localKeypair is ${localKeypair.publicKey}`
  );

  console.log(`Ping successful.`);
}

/*
Run the example (main).
*/
export async function example(programName: string, accountSpaceSize: number) {
  console.log(`Account space size is ${accountSpaceSize}`);

  await connect();
  await getLocalAccount();
  await getProgram(programName);
  await configureClientAccount(accountSpaceSize);
  await pingProgram(programName);
}
