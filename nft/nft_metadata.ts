import wallet from "../Rust-prereq-task-2/src/turbine-wallet.json";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createGenericFile,
  createSignerFromKeypair,
  signerIdentity,
} from "@metaplex-foundation/umi";
import { irysUploader } from "@metaplex-foundation/umi-uploader-irys";

const umi = createUmi("https://api.devnet.solana.com");
let keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);

umi.use(irysUploader());
umi.use(signerIdentity(signer));

(async () => {
  try {
    const image =
      "https://devnet.irys.xyz/4TMwpGBp2LsVxQCzxHTw7j9TH4LTmPMV3xpJuuHd7PJR";
    const metadata = {
      name: "Very Rare, magical rug",
      symbol: "RUGGERD",
      description: "A legenedary rug which will give you magical powers",
      image,
      attributes: [{ trait_type: "legendary", value: "1" }],
      properties: { files: [{ type: "image/png", uri: image }] },
      creators: [],
    };
    const myUri = await umi.uploader.uploadJson(metadata);
    console.log(`Your metadata uri is: ${myUri}`);
  } catch (error) {
    console.error(`Oops, something went wrong: ${error}`);
  }
})();
//Your metadata uri is: https://gateway.irys.xyz/8qRYNtJyhior8R4uHmhqejYCHkjaX64PEPBinaPZ8dfP
