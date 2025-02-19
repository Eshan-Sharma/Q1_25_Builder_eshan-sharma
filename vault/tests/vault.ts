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
  let withdrawAmount = 0.5 * LAMPORTS_PER_SOL;

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

  it("Initialize vault state and pda", async () => {
    [vaultStatePda, stateBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("state"), signer.publicKey.toBuffer()],
      program.programId
    );

    [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), vaultStatePda.toBuffer()],
      program.programId
    );

    console.log("Vault State PDA:", vaultStatePda.toBase58());
    console.log("Vault PDA:", vaultPda.toBase58());
  });

  it("Performs a deposit", async () => {
    await program.methods
      .initialize()
      .accountsPartial({
        signer: signer.publicKey,
        vaultState: vaultStatePda,
        systemProgram: SystemProgram.programId,
      })
      .signers([signer])
      .rpc();

    await program.methods
      .deposit(new anchor.BN(depositAmount))
      .accountsPartial({
        signer: signer.publicKey,
        vaultState: vaultStatePda,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .signers([signer])
      .rpc();
    const vaultBalance = await provider.connection.getBalance(vaultPda);
    assert.equal(
      vaultBalance,
      depositAmount,
      "Vault should have deposited 1 SOL"
    );
  });

  it("Performs a withdraw", async () => {
    [vaultStatePda, stateBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("state"), signer.publicKey.toBuffer()],
      program.programId
    );

    [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), vaultStatePda.toBuffer()],
      program.programId
    );

    const initialBalance = await provider.connection.getBalance(
      signer.publicKey
    );
    const initialVaultBalance = await provider.connection.getBalance(vaultPda);

    const blockhashContext = await provider.connection.getLatestBlockhash();

    const withdrawIx = await program.methods
      .withdraw(new anchor.BN(withdrawAmount)) // Specify the amount you want to withdraw
      .accountsPartial({
        signer: signer.publicKey,
        vaultState: vaultStatePda,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    const message = new anchor.web3.Transaction({
      feePayer: signer.publicKey,
      blockhash: blockhashContext.blockhash,
      lastValidBlockHeight: blockhashContext.lastValidBlockHeight,
    })
      .add(withdrawIx)
      .compileMessage();

    const feeCalculator = await provider.connection.getFeeForMessage(message);
    const txFee = feeCalculator.value || 0;

    try {
      const withdrawIx = await program.methods
        .withdraw(new anchor.BN(withdrawAmount))
        .accountsPartial({
          signer: signer.publicKey,
          vaultState: vaultStatePda,
          vault: vaultPda,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      const blockhashContext = await provider.connection.getLatestBlockhash();

      const tx = new anchor.web3.Transaction({
        feePayer: signer.publicKey,
        blockhash: blockhashContext.blockhash,
        lastValidBlockHeight: blockhashContext.lastValidBlockHeight,
      }).add(withdrawIx);

      const sig = await anchor.web3.sendAndConfirmTransaction(
        provider.connection,
        tx,
        [signer],
        { skipPreflight: true }
      );
      const finalBalance = await provider.connection.getBalance(
        signer.publicKey
      );
      const finalVaultBalance = await provider.connection.getBalance(vaultPda);
      console.log("Transaction Signature:", sig);
      assert(finalBalance > initialBalance);
      assert(finalVaultBalance < initialVaultBalance);
    } catch (e) {
      console.log(e.message);
      console.log(e.logs);
      assert.fail("Failed to withdraw funds");
    }
  });
  it("Performs a close", async () => {
    [vaultStatePda, stateBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("state"), signer.publicKey.toBuffer()],
      program.programId
    );

    [vaultPda, vaultBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), vaultStatePda.toBuffer()],
      program.programId
    );
    const initialBalance = await provider.connection.getBalance(
      signer.publicKey
    );
    const blockhashContext = await provider.connection.getLatestBlockhash();

    const closeIx = await program.methods
      .close()
      .accountsPartial({
        signer: signer.publicKey,
        vaultState: vaultStatePda,
        vault: vaultPda,
        systemProgram: SystemProgram.programId,
      })
      .instruction();

    const message = new anchor.web3.Transaction({
      feePayer: signer.publicKey,
      blockhash: blockhashContext.blockhash,
      lastValidBlockHeight: blockhashContext.lastValidBlockHeight,
    })
      .add(closeIx)
      .compileMessage();

    try {
      const closeIx = await program.methods
        .close()
        .accountsPartial({
          signer: signer.publicKey,
          vaultState: vaultStatePda,
          vault: vaultPda,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      const blockhashContext = await provider.connection.getLatestBlockhash();

      const tx = new anchor.web3.Transaction({
        feePayer: signer.publicKey,
        blockhash: blockhashContext.blockhash,
        lastValidBlockHeight: blockhashContext.lastValidBlockHeight,
      }).add(closeIx);

      const sig = await anchor.web3.sendAndConfirmTransaction(
        provider.connection,
        tx,
        [signer],
        { skipPreflight: true }
      );
      const finalBalance = await provider.connection.getBalance(
        signer.publicKey
      );
      const finalVaultBalance = await provider.connection.getBalance(vaultPda);
      console.log("Transaction Signature:", sig);
      assert(finalBalance > initialBalance);
      assert.equal(finalVaultBalance, 0, "Vault is empty");
    } catch (e) {
      console.log(e.message);
      console.log(e.logs);
      assert.fail("Failed to close vault");
    }
  });
});
