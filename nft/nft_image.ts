import wallet from "../Rust-prereq-task-2/src/turbine-wallet.json";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createGenericFile,
  createSignerFromKeypair,
  signerIdentity,
} from "@metaplex-foundation/umi";

import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";
import { readFile } from "fs/promises";

const umi = createUmi("https://api.devnet.solana.com");
let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(signer));

(async () => {
  try {
    const image = await readFile("./generug.png");
    const genericImg = createGenericFile(image, "generug.png");
    const [myUri] = await umi.uploader.upload([genericImg]);
  } catch (error) {
    console.error(`Oops, something went wrong: ${error}`);
  }
})();
