import { Keypair, Connection, Commitment } from "@solana/web3.js";
import { createMint } from "@solana/spl-token";
import wallet from "../Rust-prereq-task/src/turbine-wallet.json";

const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));
const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

(async () => {
  try {
    const mint = await createMint(
      connection,
      keypair,
      keypair.publicKey,
      null,
      6
    );
    console.log(`mint address: ${mint}`);
  } catch (error) {
    console.error(`Oops,an error occurred: ${error}`);
  }
})();
//mint address: 9yKknd27qJJx24pj1RGndAHxuVeLLJ1Hsbo4UFVEdCxX
