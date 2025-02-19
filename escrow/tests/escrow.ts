import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Escrow } from "../target/types/escrow";
import {
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
} from "@solana/web3.js";
import { before } from "mocha";
import {
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getAccount,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { randomBytes } from "node:crypto";
import { assert } from "chai";
describe("escrow", () => {
  let provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Escrow as Program<Escrow>;
  const TOKEN_PROGRAM: typeof TOKEN_2022_PROGRAM_ID | typeof TOKEN_PROGRAM_ID =
    TOKEN_2022_PROGRAM_ID;
  let maker = anchor.web3.Keypair.generate();
  let taker = anchor.web3.Keypair.generate();

  let mintA: anchor.web3.PublicKey;
  let mintB: anchor.web3.PublicKey;
  let makerMintAtaA;
  let makerMintAtaB;
  let takerMintAtaA;
  let takerMintAtaB;

  let escrow: anchor.web3.PublicKey;
  let vault: anchor.web3.PublicKey;
  let receiveAmount = new anchor.BN(1_000_000);
  let depositAmount = new anchor.BN(500_000);
  let seed = new anchor.BN(randomBytes(8));

  before(async () => {
    const makerAirdrop = await provider.connection.requestAirdrop(
      maker.publicKey,
      10 * LAMPORTS_PER_SOL
    );
    const takerAirdrop = await provider.connection.requestAirdrop(
      taker.publicKey,
      10 * LAMPORTS_PER_SOL
    );

    const latestBlockhash = await provider.connection.getLatestBlockhash();
    await provider.connection.confirmTransaction({
      signature: makerAirdrop,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });
    await provider.connection.confirmTransaction({
      signature: takerAirdrop,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });
    mintA = await createMint(
      provider.connection,
      maker,
      maker.publicKey,
      null,
      6
    );
    mintB = await createMint(
      provider.connection,
      taker,
      taker.publicKey,
      null,
      6
    );

    makerMintAtaA = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      maker,
      mintA,
      maker.publicKey
    );
    makerMintAtaB = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      maker,
      mintB,
      maker.publicKey
    );
    takerMintAtaA = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      taker,
      mintA,
      taker.publicKey
    );
    takerMintAtaB = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      taker,
      mintB,
      taker.publicKey
    );

    await mintTo(
      provider.connection,
      maker,
      mintA,
      makerMintAtaA.address,
      maker.publicKey,
      1000
    );
    await mintTo(
      provider.connection,
      taker,
      mintB,
      takerMintAtaB.address,
      taker,
      1000
    );

    [escrow] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("escrow"),
        maker.publicKey.toBuffer(),
        seed.toBuffer("le", 8),
      ],
      program.programId
    );
    vault = await anchor.utils.token.associatedAddress({
      mint: mintA,
      owner: escrow,
    });
  });

  it("Perform Make", async () => {
    const sig = await program.methods
      .make(seed, receiveAmount, depositAmount)
      .accountsPartial({
        maker: maker.publicKey,
        mintA,
        mintB,
        makerMintAAta: makerMintAtaA.address,
        vault,
        escrow,
        tokenProgram: TOKEN_PROGRAM,
        systemProgram: SystemProgram.programId,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
      })
      .signers([maker])
      .rpc();
    const escrowAccount = await program.account.escrow.fetch(escrow);
    assert.ok(escrowAccount.maker.equals(maker.publicKey));
    assert.ok(escrowAccount.mintA.equals(mintA));
    assert.ok(escrowAccount.mintB.equals(mintB));
    assert.ok(escrowAccount.receiveAmount.eq(depositAmount));

    const vaultAccount = await getAccount(provider.connection, vault);
    assert.ok(vaultAccount.amount === BigInt(depositAmount.toString()));
  });

  // it("Perform Take", async () => {});
  // it("Perform Refund", async () => {});
});
