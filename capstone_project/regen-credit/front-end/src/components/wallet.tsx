"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreateCarbonCredits } from "./create-carbon-credits";
import { ListCarbonCredits } from "./list-carbon-credits";
import { Marketplace } from "./marketplace";
import { MyCarbonCredits } from "./my-carbon-credits";
import { Leaf } from "lucide-react";

export function Wallet() {
  const { publicKey, connected } = useWallet();

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-2">
          <Leaf className="h-8 w-8 text-green-600" />
          <h1 className="text-2xl font-bold text-green-800">
            RegenCredit Protocol
          </h1>
        </div>

        <WalletMultiButton className="bg-green-600 hover:bg-green-700" />
      </header>

      {connected ? (
        <>
          <div className="flex justify-center">
            <div className="flex items-center gap-2">
              <div className="text-sm text-gray-600">
                Connected: {publicKey?.toBase58().slice(0, 4)}...
                {publicKey?.toBase58().slice(-4)}
              </div>
              <div className="h-3 w-3 rounded-full bg-green-500"></div>
            </div>
          </div>

          <Tabs defaultValue="create" className="w-full">
            <TabsList className="w-full flex justify-between mb-8">
              <TabsTrigger value="create">Create Credits</TabsTrigger>
              <TabsTrigger value="list">List Credits</TabsTrigger>
              <TabsTrigger value="marketplace">Marketplace</TabsTrigger>
              <TabsTrigger value="my-credits">My Credits</TabsTrigger>
            </TabsList>
            <TabsContent value="create">
              <CreateCarbonCredits />
            </TabsContent>
            <TabsContent value="list">
              <ListCarbonCredits />
            </TabsContent>
            <TabsContent value="marketplace">
              <Marketplace />
            </TabsContent>
            <TabsContent value="my-credits">
              <MyCarbonCredits />
            </TabsContent>
          </Tabs>
        </>
      ) : (
        <div className="text-center py-20">
          <h2 className="text-xl font-semibold mb-4">
            Welcome to Carbon Credits Protocol
          </h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Connect your Solana wallet to create, list, and purchase carbon
            credits on the blockchain.
          </p>
          <WalletMultiButton className="bg-green-600 hover:bg-green-700" />
        </div>
      )}
    </div>
  );
}
