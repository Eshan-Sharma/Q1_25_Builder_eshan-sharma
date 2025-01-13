import {
  Transaction,
  SystemProgram,
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  sendAndConfirmTransaction,
  PublicKey,
} from "@solana/web3.js";
import wallet from "./dev-wallet.json";
const fromWallet = Keypair.fromSecretKey(new Uint8Array(wallet));
const toWallet = new PublicKey("gyQyxHt1XNvaUJcySyhtv9bRd522HsrXdiyYjeZnAYW");
const connection = new Connection("https://api.devnet.solana.com");
(async () => {
  try {
    const balance = await connection.getBalance(fromWallet.publicKey);
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromWallet.publicKey,
        toPubkey: toWallet,
        lamports: balance,
      })
    );
    transaction.recentBlockhash = (
      await connection.getLatestBlockhash("confirmed")
    ).blockhash;
    transaction.feePayer = fromWallet.publicKey;
    const fee =
      (
        await connection.getFeeForMessage(
          transaction.compileMessage(),
          "confirmed"
        )
      ).value || 0;
    transaction.instructions.pop();
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: fromWallet.publicKey,
        toPubkey: toWallet,
        lamports: balance - fee,
      })
    );
    const signature = await sendAndConfirmTransaction(connection, transaction, [
      fromWallet,
    ]);
    console.log(
      `Success! https://explorer.solana.com/tx/${signature}?cluster=devnet`
    );
  } catch (error) {
    console.log(`Oops, something went wrong: ${error}`);
  }
})();
//First transfer - https://explorer.solana.com/tx/4f2o8KdwozZ5MzvLsDdxv2MQ3sgVqhTgTruGN27KsRmYRmuXxoKQgXEFpPQtamMXPMc94R5H5Da4Zz95XiWyZuyh?cluster=devnet
//Full transfer - https://explorer.solana.com/tx/4trKiZEqrsGxVCSnqrzHgeMXEvBVwa4qxvWyMVD8XP1qUJumzqBP1Q2ntJtdEE4EyFBR6vJNvarHLQMtAsUUvbe5?cluster=devnet
