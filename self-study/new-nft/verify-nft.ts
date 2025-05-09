import {
  findMetadataPda,
  mplTokenMetadata,
  verifyCollectionV1,
} from "@metaplex-foundation/mpl-token-metadata";

import {
  airdropIfRequired,
  getKeypairFromFile,
} from "@solana-developers/helpers";

import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";

import { Connection, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { keypairIdentity, publicKey } from "@metaplex-foundation/umi";

const connection = new Connection("https://api.devnet.solana.com");
const user = await getKeypairFromFile();
await airdropIfRequired(
  connection,
  user.publicKey,
  1 * LAMPORTS_PER_SOL,
  0.5 * LAMPORTS_PER_SOL
);

console.log("Loaded user", user.publicKey.toBase58());

const umi = await createUmi(connection);
umi.use(mplTokenMetadata());

const umiUser = umi.eddsa.createKeypairFromSecretKey(user.secretKey);
umi.use(keypairIdentity(umiUser));

console.log("Set up Umi instance for user");

const collectionAddress = publicKey(
  "ChfGtd2wT12c2u82PHNpe4PdQ5PMqJnVECfaNbQ2uaVw"
);
const nftAddress = publicKey("84uZmnRpzfa77w3KtyagjWXA8g1yE6vP8ReuHyN5HZaN");

const transaction = await verifyCollectionV1(umi, {
  metadata: findMetadataPda(umi, { mint: nftAddress }),
  collectionMint: collectionAddress,
  authority: umi.identity,
});
transaction.sendAndConfirm(umi);

console.log(
  `NFT: ${nftAddress} verified as member of collection: ${collectionAddress}`
);
