import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { RegenCredit } from "../target/types/regen_credit";
import { assert } from "chai";

describe("regen-credit", () => {
  let provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.RegenCredit as Program<RegenCredit>;

  let maker = anchor.web3.Keypair.generate();
  enum Country {
    India = "India",
  }
  enum EnergyUnits {
    KWh = "KWh",
  }
  before(async () => {
    await provider.connection.confirmTransaction(
      await provider.connection.requestAirdrop(
        maker.publicKey,
        anchor.web3.LAMPORTS_PER_SOL * 20
      )
    );
  });

  it("Should create a CarbonCredit Account with correct values", async () => {
    let [carbonCreditPda, carbonCreditBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("carbon_credit"), maker.publicKey.toBuffer()],
        program.programId
      );

    await program.methods
      .initializeCarbonCredit([Country.India], 10, 1000, [EnergyUnits.KWh])
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

    assert.equal(carbonCredit.country.toString(), "India");
    assert.equal(carbonCredit.value, 1000);
    assert.equal(carbonCredit.units.toString(), "KWh");
    assert.equal(carbonCredit.pricePerCarbonCredit, 10);
    assert.equal(carbonCredit.listed, false);
    assert.equal(
      carbonCredit.remainingCarbonCredits,
      carbonCredit.originalCarbonCredits
    );
  });
  it("Should fail if maker is not the signer", async () => {
    const otherUser = anchor.web3.Keypair.generate();
    const initParams = {
      country: Country.India,
      pricePerCarbonCredit: new anchor.BN(10),
      value: new anchor.BN(1000),
      units: EnergyUnits.KWh,
    };
    let [carbonCreditPda, carbonCreditBump] =
      await anchor.web3.PublicKey.findProgramAddress(
        [Buffer.from("carbon_credit"), maker.publicKey.toBuffer()],
        program.programId
      );
    try {
      await program.methods
        .initializeCarbonCredit(initParams)
        .accountsPartial({
          maker: maker.publicKey,
          carbonCredit: carbonCreditPda,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([otherUser])
        .rpc();
      assert.fail("Expected transaction to fail");
    } catch (err) {
      assert.include(err.message, "ConstraintSigner");
    }
  });
  it("Should fail if value or grid_emission_factor is zero", async () => {});
  it("Should fail if price_per_carbon_credit is zero", async () => {});
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
