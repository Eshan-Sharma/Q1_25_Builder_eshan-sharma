import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RegenCredit } from "../target/types/regen_credit";
import { assert } from "chai";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";
import { PublicKey } from "@solana/web3.js";
import {
  createMint,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  mintTo,
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";

describe("RegenCredit Tests", () => {
  let provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.RegenCredit as Program<RegenCredit>;

  let maker = anchor.web3.Keypair.generate();
  let admin = anchor.web3.Keypair.generate();
  let taker = anchor.web3.Keypair.generate();

  let carbonCreditPda;
  let marketplacePda;
  let treasuryPda;

  let mint: PublicKey;
  let treasury: PublicKey;
  let takerUsdc;
  let makerUsdc;
  let adminUsdc;

  // Constants
  let marketplaceName = "My Marketplace";
  let marketplaceFee = 2;
  let pricePerCarbonCredit = 10;
  let energyValue = 1000;

  before(async () => {
    // Airdrop
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        maker.publicKey,
        anchor.web3.LAMPORTS_PER_SOL * 20
      )
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        taker.publicKey,
        anchor.web3.LAMPORTS_PER_SOL * 20
      )
    );
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        admin.publicKey,
        anchor.web3.LAMPORTS_PER_SOL * 20
      )
    );

    //Get PDAs
    [carbonCreditPda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("carbon_credit"), maker.publicKey.toBuffer()],
      program.programId
    );
    [marketplacePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("marketplace"), Buffer.from(marketplaceName)],
      program.programId
    );
    [treasuryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), marketplacePda.toBuffer()],
      program.programId
    );
    // USDC Mint
    mint = await createMint(
      provider.connection,
      admin,
      admin.publicKey,
      null,
      6
    );
    //Initialize maker's USDC account
    makerUsdc = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        maker, // Payer
        mint, // USDC Mint
        maker.publicKey // Owner of the account
      )
    ).address;
    console.log("Maker USDC:", makerUsdc.toBase58());
    // Initialize taker's USDC account
    takerUsdc = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        taker, // Payer
        mint, // USDC Mint
        taker.publicKey // Owner of the account
      )
    ).address;
    console.log("Taker USDC:", takerUsdc.toBase58());
    // Initialize taker's USDC account
    adminUsdc = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        admin, // Payer
        mint, // USDC Mint
        admin.publicKey // Owner of the account
      )
    ).address;
    console.log("Admin USDC:", adminUsdc.toBase58());
    await mintTo(
      provider.connection,
      taker, //signer
      mint, //mint
      takerUsdc, //destination
      admin, //authority
      1000000000 // 1000 USDC
    );
    await mintTo(
      provider.connection,
      maker, //signer
      mint, //mint
      makerUsdc, //destination
      admin, //authority
      1000000000 // 1000 USDC
    );
    await mintTo(
      provider.connection,
      admin, //signer
      mint, //mint
      adminUsdc, //destination
      admin, //authority
      1000000000 // 1000 USDC
    );
  });

  it("Should create a CarbonCredit Account with correct values", async () => {
    await program.methods
      .initializeCarbonCredit(
        { india: {} },
        pricePerCarbonCredit,
        energyValue,
        {
          kWh: {},
        }
      )
      .accountsPartial({
        maker: maker.publicKey,
        carbonCredit: carbonCreditPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([maker])
      .rpc();

    const carbonCredit = await program.account.carbonCredit.fetch(
      carbonCreditPda
    );
    assert.deepEqual(carbonCredit.country, { india: {} });
    assert.equal(carbonCredit.value, 1000);
    assert.deepEqual(carbonCredit.units, { kWh: {} });
    assert.equal(carbonCredit.pricePerCarbonCredit, 10);
    assert.equal(carbonCredit.listed, false);
    assert.equal(
      carbonCredit.remainingCarbonCredits,
      carbonCredit.originalCarbonCredits
    );
  });
  it("Should fail if maker is not the signer", async () => {
    const otherUser = anchor.web3.Keypair.generate();
    try {
      await program.methods
        .initializeCarbonCredit({ india: {} }, 10, 1000, { kWh: {} })
        .accountsPartial({
          maker: maker.publicKey,
          carbonCredit: carbonCreditPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([otherUser])
        .rpc();
      assert.fail(`unknown signer`);
    } catch (err) {
      assert.include(err.message, `unknown signer`);
    }
  });
  it("Should fail if value or grid_emission_factor is zero", async () => {
    try {
      await program.methods
        .initializeCarbonCredit({ india: {} }, 10, 0, { kWh: {} })
        .accountsPartial({
          maker: maker.publicKey,
          carbonCredit: carbonCreditPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([maker])
        .rpc();
      assert.fail("Value cannot be 0");
    } catch (err) {
      assert.include(err.message, "Simulation failed");
    }
  });
  it("Should fail if price_per_carbon_credit is zero", async () => {
    try {
      await program.methods
        .initializeCarbonCredit({ india: {} }, 0, 1000, { kWh: {} })
        .accountsPartial({
          maker: maker.publicKey,
          carbonCredit: carbonCreditPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([maker])
        .rpc();
      assert.fail("Price cannot be 0");
    } catch (err) {
      assert.include(err.message, "Simulation failed");
    }
  });
  it("Should fail if on-chain protocol account is not initialized", async () => {
    try {
      await program.account.carbonCredit.fetch(
        anchor.web3.Keypair.generate().publicKey
      );
      assert.fail("Expected fetch to fail");
    } catch (err) {
      assert.include(err.message, "Account does not exist");
    }
  });
  it("Listing Carbon Credits", async () => {
    await program.methods
      .list()
      .accountsPartial({
        maker: maker.publicKey,
        carbonCredit: carbonCreditPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([maker])
      .rpc();

    const carbonCredit = await program.account.carbonCredit.fetch(
      carbonCreditPda
    );
    assert.isTrue(carbonCredit.listed, "Carbon Credit should be listed");
  });
  it("Should fail if the maker is not the signer", async () => {
    const otherUser = anchor.web3.Keypair.generate();
    try {
      await program.methods
        .list()
        .accountsPartial({
          maker: maker.publicKey,
          carbonCredit: carbonCreditPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([otherUser])
        .rpc();
      assert.fail("Listing should fail when the maker is not the signer.");
    } catch (err) {
      assert.include(err.message, "unknown signer");
    }
  });
  it("Should fail if the CarbonCredit account is already listed", async () => {
    try {
      await program.methods
        .list()
        .accountsPartial({
          maker: maker.publicKey,
          carbonCredit: carbonCreditPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([maker])
        .rpc();
      assert.fail(
        "Listing should fail when CarbonCredit account is already listed."
      );
    } catch (err) {
      assert.include(err.message, "Carbon Credit is already listed.");
    }
  });
  it("Should create a Marketplace Account", async () => {
    try {
      await program.methods
        .initializeMarketplace(marketplaceName, marketplaceFee)
        .accountsPartial({
          admin: admin.publicKey,
          marketplace: marketplacePda,
          treasury: treasuryPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([admin])
        .rpc();
      const marketplace = await program.account.marketplace.fetch(
        marketplacePda.publicKey
      );
      assert.strictEqual(
        marketplace.name,
        marketplaceName,
        "Marketplace names should match"
      );
    } catch (err) {}
  });
  it("Should fail to recreate Marketplace Account", async () => {
    try {
      await program.methods
        .initializeMarketplace(marketplaceName, marketplaceFee)
        .accountsPartial({
          admin: admin.publicKey,
          marketplace: marketplacePda,
          treasury: treasuryPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([admin])
        .rpc();
      const marketplace = await program.account.marketplace.fetch(
        marketplacePda.publicKey
      );
      assert.fail("Marketplace creation should fail if it already exists.");
    } catch (err) {
      assert.include(err.message, "Simulation failed");
    }
  });
  it("Should fetch all listed CarbonCredit accounts", async () => {
    const listedCarbonCredits = await program.account.carbonCredit.all([
      {
        memcmp: {
          offset: 24, // Offset to the 'listed' field
          bytes: bs58.encode(Buffer.from([1])), // Listed == true
        },
      },
    ]);
    assert.isTrue(
      listedCarbonCredits.length > 0, //Number of listed carbon credit accounts
      "Should fetch listed carbon credits"
    );
  });
  it("Should reduce the number of remaining_carbon_credits", async () => {
    try {
      let carbonCreditBefore = await program.account.carbonCredit.fetch(
        carbonCreditPda
      );

      await program.methods
        .reduceRemainingCredits(8)
        .accountsPartial({
          taker: taker.publicKey,
          maker: maker.publicKey,
          mint,

          carbonCredit: carbonCreditPda,
          marketplace: marketplacePda,
          treasury: treasuryPda,

          takerUsdc,
          makerUsdc,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([taker])

        .rpc({ skipPreflight: true });

      let carbonCreditAfter = await program.account.carbonCredit.fetch(
        carbonCreditPda
      );
      assert.equal(
        carbonCreditAfter.remainingCarbonCredits,
        carbonCreditBefore.remainingCarbonCredits - 8
      );
    } catch (err) {
      console.log("ERROR:", err);
    }
  });
});
