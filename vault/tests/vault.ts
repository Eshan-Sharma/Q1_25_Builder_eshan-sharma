import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Vault } from "../target/types/vault";
import {
  PublicKey,
  SystemProgram,
  Keypair,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import { assert } from "chai";

describe("vault", () => {
  let provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Vault as Program<Vault>;

  let signer = anchor.web3.Keypair.generate();
  let vaultStatePda: PublicKey;
  let vaultPda: PublicKey;
  let vaultBump: number;
  let stateBump: number;
  let depositAmount = 1 * LAMPORTS_PER_SOL;

  it("Fund the signer account", async () => {
    // Add your test here.
    const airdrop = await provider.connection.requestAirdrop(
      signer.publicKey,
      2 * depositAmount
    );
    await provider.connection.confirmTransaction(airdrop);
    const balance = await provider.connection.getBalance(signer.publicKey);
    assert.equal(balance, 2 * LAMPORTS_PER_SOL, "Signer should have 2 SOL");
  });
});
