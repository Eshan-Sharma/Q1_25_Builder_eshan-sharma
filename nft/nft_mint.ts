import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createSignerFromKeypair,
  signerIdentity,
  generateSigner,
  percentAmount,
} from "@metaplex-foundation/umi";
import {
  createNft,
  mplTokenMetadata,
} from "@metaplex-foundation/mpl-token-metadata";

import wallet from "../Rust-prereq-task-2/src/turbine-wallet.json";
import base58 from "bs58";

const umi = createUmi("https://api.devnet.solana.com");
let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(signerIdentity(signer));
umi.use(mplTokenMetadata());

const mint = generateSigner(umi);

(async () => {
  try {
    let tx = createNft(umi, {
      mint,
      uri: "https://devnet.irys.xyz/8qRYNtJyhior8R4uHmhqejYCHkjaX64PEPBinaPZ8dfP",
      name: "Rarest Rug",
      sellerFeeBasisPoints: percentAmount(90),
    });
    let result = await tx.sendAndConfirm(umi);
    const signature = base58.encode(result.signature);
    console.log(
      `Tx hash: https://explorer.solana.com/tx/${signature}?cluster=devnet`
    );
    console.log(`Mint address: ${mint.publicKey}`);
  } catch (error) {
    console.error(`Oops, something went wrong: ${error}`);
  }
})();
// Tx hash: https://explorer.solana.com/tx/5XuesEBt6gf6Kt9gx9v8eRnGgexNWb3m1EGfBztcA3XsApwj9abS8KmKP1DWPM123t6N1bpD33hU9nkjEywcEBhV?cluster=devnet
// Mint address: Br1d3vb8Pzw3pPFa1J4mukCDHK8P5ywmXq8tAVMtJQCt
