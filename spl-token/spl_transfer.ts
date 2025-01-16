import {
  Commitment,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
} from "@solana/web3.js";
import wallet from "../Rust-prereq-task-2/src/turbine-wallet.json";
import { getOrCreateAssociatedTokenAccount, transfer } from "@solana/spl-token";
import { publicKey } from "@metaplex-foundation/umi";

const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));

const commitment: Commitment = "confirmed";
const connection = new Connection("https://api.devnet.solana.com", commitment);

const mint = new PublicKey("9yKknd27qJJx24pj1RGndAHxuVeLLJ1Hsbo4UFVEdCxX");

const toWallet = new PublicKey("8dRUT6eQTijZLbXAaUjupPzDQEbKk1Lygy2cFw5KAPTC");

(async () => {
  try {
    const fromWalletAta = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      keypair.publicKey
    );
    const toWalletAta = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      toWallet
    );
    const tx = await transfer(
      connection,
      keypair,
      fromWalletAta.address,
      toWalletAta.address,
      keypair.publicKey,
      300
    );
    console.log(`tx hash: ${tx}`);
  } catch (error) {
    console.error(`Oops, something went wrong: ${error}`);
  }
})();
//tx hash: 3TApC9mgn5SS7yUVdVDygMBDF94fGdsUMV64y1DpjJrbUNvqiFsJuiha8p17YbVprrJwDZSuVnQ1G1EYkH2KRch7
