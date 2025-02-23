import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Marketplace } from "../target/types/marketplace";
import { TOKEN_PROGRAM_ID, createMint } from "@solana/spl-token";
import { SystemProgram } from "@solana/web3.js";

describe("marketplace", () => {
  let provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.Marketplace as Program<Marketplace>;

  let name = "My first marketplace".toString();
  let fee = 2;
  let marketplace;
  let treasury;
  let rewardsMint;

  let admin = anchor.web3.Keypair.generate();
  before(async () => {
    [marketplace] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("marketplace"), Buffer.from(name)],
      program.programId
    );
    console.log("HERE: ", marketplace[0]);
    [treasury] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("treasury"), marketplace.publicKey.toBuffer()],
      program.programId
    );
    [rewardsMint] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("rewards"), marketplace.publicKey.toBuffer()],
      program.programId
    );
  });
  it("Initialize Marketplace", async () => {
    await program.methods
      .initialize(name, fee)
      .accountsPartial({
        admin: admin.publicKey,
        marketplace,
        treasury,
        rewardsMint,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([admin])
      .rpc();
  });
});
