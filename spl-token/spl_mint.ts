import { Keypair, PublicKey, Commitment, Connection } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token";
import wallet from "../Rust-prereq-task/src/turbine-wallet.json";

const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

const mintAddress = new PublicKey(
  "9yKknd27qJJx24pj1RGndAHxuVeLLJ1Hsbo4UFVEdCxX"
);

(async () => {
  try {
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mintAddress,
      keypair.publicKey
    );
    console.log(`ata: ${ata}`);
    const mintTx = await mintTo(
      connection,
      keypair,
      mintAddress,
      ata.address,
      keypair.publicKey,
      1_000_000_000
    );
    console.log(`Mint transaction: ${mintTx}`);
  } catch (error) {
    console.error(`Oops, something went wrong: ${error}`);
  }
})();
//ata: [object Object]
// Mint transaction: f6hLMASme1Gt1BvPRKV64ZFgvwUd3NXqhSdVy6bkHTaxLT5F8x36EnMTTabpvMnPddDpJWRtGLJJb9VmX24jQDt
