import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RegenCredit } from "../target/types/regen_credit";
import { assert } from "chai";

describe("regen-credit", () => {
  let provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.RegenCredit as Program<RegenCredit>;

  let maker = anchor.web3.Keypair.generate();
  let carbonCreditPda;

  before(async () => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        maker.publicKey,
        anchor.web3.LAMPORTS_PER_SOL * 20
      )
    );
    [carbonCreditPda] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("carbon_credit"), maker.publicKey.toBuffer()],
      program.programId
    );
  });

  it("Should create a CarbonCredit Account with correct values", async () => {
    await program.methods
      .initializeCarbonCredit({ india: {} }, 10, 1000, { kWh: {} })
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
});
