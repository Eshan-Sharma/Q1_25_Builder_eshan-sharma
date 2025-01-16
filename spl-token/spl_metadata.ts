import wallet from "../Rust-prereq-task-2/src/turbine-wallet.json";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import {
  createMetadataAccountV3,
  CreateMetadataAccountV3InstructionAccounts,
  CreateMetadataAccountV3InstructionArgs,
  DataV2Args,
} from "@metaplex-foundation/mpl-token-metadata";
import {
  createSignerFromKeypair,
  signerIdentity,
  publicKey,
} from "@metaplex-foundation/umi";
import { bs58 } from "@coral-xyz/anchor/dist/cjs/utils/bytes";

const mint = publicKey("9yKknd27qJJx24pj1RGndAHxuVeLLJ1Hsbo4UFVEdCxX");

const umi = createUmi("https://api.devnet.solana.com");
const keypair = umi.eddsa.createKeypairFromSecretKey(new Uint8Array(wallet));
const signer = createSignerFromKeypair(umi, keypair);
umi.use(signerIdentity(signer));

(async () => {
  try {
    let accounts: CreateMetadataAccountV3InstructionAccounts = {
      mint,
      mintAuthority: signer,
    };
    let data: DataV2Args = {
      name: "Million Dollars Token",
      symbol: "MIL",
      uri: "bafybeigvn6flfwx5t7pte2hg5vxavbe5mx3ib5ihojfkpbl2ndk3gwfcne.ipfs.w3s.link/chad_driver.png",
      sellerFeeBasisPoints: 0,
      creators: null,
      collection: null,
      uses: null,
    };
    let args: CreateMetadataAccountV3InstructionArgs = {
      data,
      isMutable: false,
      collectionDetails: null,
    };
    let tx = createMetadataAccountV3(umi, { ...accounts, ...args });
    let result = await tx.sendAndConfirm(umi);
    console.log(bs58.encode(result.signature));
  } catch (error) {
    console.error(`Oops, something went wrong: ${error}`);
  }
})();
//tx - 4V9QYh5poJ34mvMytWHG7BwMwKTXUHb2eQYPGxfvWkqVZj9wL6ZNdXSDuCLoFpffAE6iSutqxp4nT76P6VHfVKdS
