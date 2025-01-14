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
    console.log(`ata: ${ata.address.toBase58}`);
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
// ata: toBase58() {
//     return bs58__default.default.encode(this.toBytes());
//   }
// Mint transaction: 4owJtpUQZv79J1yiNLmLF9f34UndJkxC2gUxqWHXvrEmgMyRhMiR2dRwGZmfiernNyNs5tVdbnSGy4mBDFuc7WSm
