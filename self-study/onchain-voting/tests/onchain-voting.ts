import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OnChain } from "../target/types/on_chain";

describe("onchain-voting", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.OnChain as Program<OnChain>;
  let voteBank = anchor.web3.Keypair.generate();

  it("Creating vote bank for public to vote", async () => {
    const tx = await program.methods
      .initVoteBank()
      .accounts({
        voteAccount: voteBank.publicKey,
      })
      .signers([voteBank])
      .rpc();
    console.log("TxHash ::", tx);
  });

  it("Vote for GM", async () => {
    const tx = await program.methods
      .giveVote({ gm: {} })
      .accounts({
        voteAccount: voteBank.publicKey,
      })
      .rpc();
    console.log("TxHash ::", tx);

    let voteBankData = await program.account.voteBank.fetch(voteBank.publicKey);
    console.log(`Total GMs :: ${voteBankData.gm}`);
    console.log(`Total GNs :: ${voteBankData.gn}`);
  });

  it("Vote for GN", async () => {
    const tx = await program.methods
      .giveVote({ gn: {} })
      .accounts({
        voteAccount: voteBank.publicKey,
      })
      .rpc();
    console.log("TxHash ::", tx);

    let voteBankData = await program.account.voteBank.fetch(voteBank.publicKey);
    console.log(`Total GMs :: ${voteBankData.gm}`);
    console.log(`Total GNs :: ${voteBankData.gn}`);
  });
});
// onchain-voting
// TxHash :: 5qQoofDeAAmgXEEB968w3FyUDpnYrUfRxWsyrhebaqwu3tYp3PZ1coP1hWm8FFfw9YsxesXrEWyu64QGbpEzNWQ3
// ✔ Creating vote bank for public to vote (856ms)
// TxHash :: 4cDb3vzhFwbqYLZD2erozypMEjRAhRqPPjs927asMSpyT8CubEUtm4aUyn76a73NSQbhPx7pxW98by7WQsroeeRc
// Total GMs :: 1
// Total GNs :: 0
// ✔ Vote for GM (846ms)
// TxHash :: 2pCkScrkU6qwWehjPJgKJjPyNG19bCiYwri3TrAexbsPfQwuZTxiwYQ2vf9cE4N2ZFNLZR5oR2aG9XZo2pMxvv62
// Total GMs :: 1
// Total GNs :: 1
// ✔ Vote for GN (3571ms)
