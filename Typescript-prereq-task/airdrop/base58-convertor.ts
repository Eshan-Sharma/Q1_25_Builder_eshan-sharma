import bs58 from "bs58";

function base58ToWallet(address: string): Uint8Array {
  let bytes = bs58.decode(address);
  console.log(`Uint8Array is: ${bytes}`);
  return bytes;
}

function walletToBase58(bytesArray: number[] | Uint8Array): string {
  const bytes = Uint8Array.from(bytesArray);
  const walletAddress = bs58.encode(bytes);
  console.log(walletAddress);
  return walletAddress;
}

export { base58ToWallet, walletToBase58 };
