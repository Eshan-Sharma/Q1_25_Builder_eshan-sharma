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
import {
  MPL_CORE_PROGRAM_ID,
  fetchAsset,
  fetchCollection,
  mplCore,
} from "@metaplex-foundation/mpl-core";

const mplCoreProgramId = new PublicKey(MPL_CORE_PROGRAM_ID);

describe("RegenCredit Initialize, Listing and Marketplace tests", () => {
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
    // console.log("Maker USDC:", makerUsdc.toBase58());
    // Initialize taker's USDC account
    takerUsdc = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        taker, // Payer
        mint, // USDC Mint
        taker.publicKey // Owner of the account
      )
    ).address;
    // console.log("Taker USDC:", takerUsdc.toBase58());
    // Initialize taker's USDC account
    adminUsdc = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        admin, // Payer
        mint, // USDC Mint
        admin.publicKey // Owner of the account
      )
    ).address;
    // console.log("Admin USDC:", adminUsdc.toBase58());
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

  it("Should fail reducing carbon credit if the CarbonCredit account does not exist", async () => {
    try {
      await program.methods
        .reduceRemainingCredits(1)
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
        .rpc();
      assert.fail("Expected fetch to fail");
    } catch (err) {
      assert.include(err.message, "AccountNotInitialized");
    }
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

describe("Reduce Remaining Carbon Credits", () => {
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
  let marketplaceName = "New Marketplace";
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

    // Initialize taker's USDC account
    takerUsdc = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        taker, // Payer
        mint, // USDC Mint
        taker.publicKey // Owner of the account
      )
    ).address;

    // Initialize taker's USDC account
    adminUsdc = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        admin, // Payer
        mint, // USDC Mint
        admin.publicKey // Owner of the account
      )
    ).address;

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
  it("Initialize Carbon Credit, List and Initialize Marketplace", async () => {
    //Initialize
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

    //List
    await program.methods
      .list()
      .accountsPartial({
        maker: maker.publicKey,
        carbonCredit: carbonCreditPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([maker])
      .rpc();
    //Marketplace
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
  });
  it("Should allow purchase of partial carbon credits if sufficient are available.", async () => {
    try {
      let carbonCreditBefore = await program.account.carbonCredit.fetch(
        carbonCreditPda
      );

      await program.methods
        .reduceRemainingCredits(70)
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
        carbonCreditBefore.remainingCarbonCredits - 70
      );
    } catch (err) {
      console.log("ERROR:", err);
    }
  });
  it("Should handle partial purchases without de-listing the CarbonCredit account.", async () => {
    try {
      let carbonCreditBefore = await program.account.carbonCredit.fetch(
        carbonCreditPda
      );

      await program.methods
        .reduceRemainingCredits(carbonCreditBefore.remainingCarbonCredits - 2)
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
      assert.equal(carbonCreditAfter.remainingCarbonCredits, 2);
    } catch (err) {
      console.log("ERROR:", err);
    }
  });
  it("Should fail if the purchase amount is greater than remaining_carbon_credits.", async () => {
    try {
      let carbonCreditBefore = await program.account.carbonCredit.fetch(
        carbonCreditPda
      );
      //Reduce more carbon credit than available
      await program.methods
        .reduceRemainingCredits(carbonCreditBefore.remainingCarbonCredits + 1)
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
      assert.fail("Insufficient Carbon Credits");
    } catch (err) {}
  });
  it("Should allow purchase of full carbon credits if sufficient are available.", async () => {
    try {
      let carbonCreditBefore = await program.account.carbonCredit.fetch(
        carbonCreditPda
      );

      await program.methods
        .reduceRemainingCredits(carbonCreditBefore.remainingCarbonCredits)
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
      assert.equal(carbonCreditAfter.remainingCarbonCredits, 0);
    } catch (err) {
      console.log("ERROR:", err);
    }
  });
  it("Should set listed to false if all credits are purchased.", async () => {
    try {
      let carbonCredit = await program.account.carbonCredit.fetch(
        carbonCreditPda
      );
      assert.equal(carbonCredit.listed, false, "Carbon Credit is not listed");
      assert.equal(
        carbonCredit.remainingCarbonCredits,
        0,
        "Carbon Credits are all bought"
      );
    } catch (err) {}
  });
  it("Should fail if the CarbonCredit is not listed", async () => {
    try {
      await program.methods
        .reduceRemainingCredits(1)
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

      assert.fail("Carbon Credit is not listed");
    } catch (err) {}
  });
  it("Should fail if maker is purchaser", async () => {
    try {
      await program.methods
        .reduceRemainingCredits(1)
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
        .signers([maker])

        .rpc({ skipPreflight: true });

      assert.fail("Expected to fail, maker is purchaser");
    } catch (err) {
      assert.include(err.message, "unknown signer:");
    }
  });
});

describe("Send USDC and fee", () => {
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
  let takerUsdc;
  let makerUsdc;
  let adminUsdc;

  // Constants
  let marketplaceName = "USDC Marketplace";
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
    // Initialize taker's USDC account
    takerUsdc = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        taker, // Payer
        mint, // USDC Mint
        taker.publicKey // Owner of the account
      )
    ).address;
    // Initialize taker's USDC account
    adminUsdc = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        admin, // Payer
        mint, // USDC Mint
        admin.publicKey // Owner of the account
      )
    ).address;

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
  it("Initialize Carbon Credit, List and Initialize Marketplace", async () => {
    //Initialize
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

    //List
    await program.methods
      .list()
      .accountsPartial({
        maker: maker.publicKey,
        carbonCredit: carbonCreditPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([maker])
      .rpc();
    //Marketplace
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
  });
  it("Should calculate the SOL amount based on the number of credits and price_per_carbon_credit", async () => {
    await program.methods
      .sendUsdc(10)
      .accountsPartial({
        taker: taker.publicKey,
        maker: maker.publicKey,
        admin: admin.publicKey,
        mint,

        carbonCredit: carbonCreditPda,
        marketplace: marketplacePda,

        adminUsdc,
        takerUsdc,
        makerUsdc,
        associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([taker])
      .rpc({ skipPreflight: true });
  });
  it("Should fail if the signer is not the taker", async () => {
    try {
      await program.methods
        .sendUsdc(10)
        .accountsPartial({
          taker: taker.publicKey,
          maker: maker.publicKey,
          admin: admin.publicKey,
          mint,

          carbonCredit: carbonCreditPda,
          marketplace: marketplacePda,

          adminUsdc,
          takerUsdc,
          makerUsdc,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([maker])
        .rpc({ skipPreflight: true });
      assert.fail("Expected to fail");
    } catch (err) {}
  });
  it("Should fail if the marketplace account is not initialized", async () => {
    try {
      //Initialize
      await program.methods
        .initializeCarbonCredit(
          { china: {} },
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

      //List
      await program.methods
        .list()
        .accountsPartial({
          maker: maker.publicKey,
          carbonCredit: carbonCreditPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([maker])
        .rpc();
      await program.methods
        .sendUsdc(10)
        .accountsPartial({
          taker: taker.publicKey,
          maker: maker.publicKey,
          admin: admin.publicKey,
          mint,

          carbonCredit: carbonCreditPda,
          marketplace: marketplacePda,

          adminUsdc,
          takerUsdc,
          makerUsdc,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([taker])
        .rpc({ skipPreflight: true });
      assert.fail("Expected to fail");
    } catch (err) {
      assert.include(err.message, "Simulation failed");
    }
  });
});

describe("Admin Operations", () => {
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
  let takerUsdc;
  let makerUsdc;
  let adminUsdc;

  // Constants
  let marketplaceName = "admin Marketplace";
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
    // Initialize taker's USDC account
    takerUsdc = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        taker, // Payer
        mint, // USDC Mint
        taker.publicKey // Owner of the account
      )
    ).address;
    // Initialize taker's USDC account
    adminUsdc = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        admin, // Payer
        mint, // USDC Mint
        admin.publicKey // Owner of the account
      )
    ).address;

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
  it("Initialize Carbon Credit, List and Initialize Marketplace", async () => {
    //Initialize
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

    //List
    await program.methods
      .list()
      .accountsPartial({
        maker: maker.publicKey,
        carbonCredit: carbonCreditPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([maker])
      .rpc();
    //Marketplace
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
  });
  it("Should update the fee if admin is the signer", async () => {
    await program.methods
      .updateMarketplaceFee(3)
      .accountsPartial({
        maker: maker.publicKey,
        admin: admin.publicKey,
        carbonCredit: carbonCreditPda,
        marketplace: marketplacePda,
      })
      .signers([admin])
      .rpc();
    let marketplaceAccount = await program.account.marketplace.fetch(
      marketplacePda
    );
    let marketplaceFeeAfter = marketplaceAccount.fee;

    assert.equal(marketplaceFeeAfter, 3);
  });
  it("Should fail if a non-admin attempts the update", async () => {
    try {
      await program.methods
        .updateMarketplaceFee(3)
        .accountsPartial({
          maker: maker.publicKey,
          admin: admin.publicKey,
          carbonCredit: carbonCreditPda,
          marketplace: marketplacePda,
        })
        .signers([maker])
        .rpc();
      assert.fail("Expected to fail");
    } catch (err) {
      assert.include(err.message, "unknown signer:");
    }
  });
  it("Should allow maker to delist carbon credits", async () => {
    await program.methods
      .delist()
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
    assert.isFalse(carbonCredit.listed, "Carbon credit should be delisted");
  });
  it("Should fail if delist caller is not maker", async () => {
    try {
      await program.methods
        .delist()
        .accountsPartial({
          maker: maker.publicKey, // Invalid caller
          carbonCredit: carbonCreditPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([taker])
        .rpc();
      assert.fail("Unauthorized user should not be able to delist");
    } catch (err) {
      assert.include(err.message, "unknown signer"); // Expected failure
    }
  });
});

describe("Minting and Sending NFT", () => {
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
  let takerUsdc;
  let makerUsdc;
  let adminUsdc;
  let cardNft = anchor.web3.Keypair.generate();

  // Constants
  let marketplaceName = "nft Marketplace";
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
    // Initialize taker's USDC account
    takerUsdc = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        taker, // Payer
        mint, // USDC Mint
        taker.publicKey // Owner of the account
      )
    ).address;
    // Initialize taker's USDC account
    adminUsdc = (
      await getOrCreateAssociatedTokenAccount(
        provider.connection,
        admin, // Payer
        mint, // USDC Mint
        admin.publicKey // Owner of the account
      )
    ).address;

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
  it("Initialize Carbon Credit, List and Initialize Marketplace", async () => {
    //Initialize
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

    //List
    await program.methods
      .list()
      .accountsPartial({
        maker: maker.publicKey,
        carbonCredit: carbonCreditPda,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([maker])
      .rpc();
    //Marketplace
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
  });
  it("Should mint an NFT after receiving the correct amount of SOL", async () => {
    await program.methods
      .mintNft({
        name: "Test Card",
        uri: "https://example.com/card",
      })
      .accountsPartial({
        taker: taker.publicKey,
        maker: maker.publicKey,
        carbonCredit: carbonCreditPda,
        marketplace: marketplacePda,
        asset: cardNft.publicKey,
        mplCoreProgram: mplCoreProgramId,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([taker, maker, cardNft])
      .rpc();
  });
  it("Should include purchase details in the NFT metadata (e.g., number of credits, country, source type).", async () => {
    await program.methods
      .mintNft({
        name: "Test Card",
        uri: "https://example.com/card/ contains metadata",
      })
      .accountsPartial({
        taker: taker.publicKey,
        maker: maker.publicKey,
        carbonCredit: carbonCreditPda,
        marketplace: marketplacePda,
        asset: cardNft.publicKey,
        mplCoreProgram: mplCoreProgramId,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .signers([taker, maker, cardNft])
      .rpc();
  });
  it("Should fail if the NFT minting account is not initialized.", async () => {
    try {
      await program.methods
        .mintNft({
          name: "Test Card",
          uri: "https://example.com/card/",
        })
        .accountsPartial({
          taker: taker.publicKey,
          maker: maker.publicKey,
          carbonCredit: carbonCreditPda,
          marketplace: marketplacePda,
          asset: cardNft.publicKey,
          mplCoreProgram: mplCoreProgramId,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([taker, maker])
        .rpc();
      assert.fail("Expected to fail");
    } catch (err) {}
  });
  it("Should fail if the NFT transfer fails.", async () => {
    try {
      await program.methods
        .mintNft({
          name: "Test Card",
          uri: "https://example.com/card/",
        })
        .accountsPartial({
          taker: maker.publicKey,
          maker: maker.publicKey,
          carbonCredit: carbonCreditPda,
          marketplace: marketplacePda,
          asset: cardNft.publicKey,
          mplCoreProgram: mplCoreProgramId,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([taker, maker, cardNft])
        .rpc();
      assert.fail("Expected to fail");
    } catch (err) {}
  });
});
