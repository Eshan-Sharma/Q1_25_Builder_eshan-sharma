import { Connection, Keypair, LAMPORTS_PER_SOL } from "@solana/web3.js";
import wallet from "./dev-wallet.json";

const keypair = Keypair.fromSecretKey(new Uint8Array(wallet));
const connection = new Connection("https://api.devnet.solana.com");

(async () => {
  try {
    const txhash = await connection.requestAirdrop(
      keypair.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    console.log(
      `Success! https://explorer.solana.com/tx/${txhash}?cluster=devnet`
    );
  } catch (e) {
    console.log(`Oops, something is wrong: ${e}`);
  }
})();

//https://explorer.solana.com/tx/4YWhnEb89kJgHiiAKYmqkivnjqwpqzpS8hPNB3ssE9KU3fFZ7RATG5u9DM94jqoGJsEYfEpJZW6pL5d2P5qtCWY9?cluster=devnet
