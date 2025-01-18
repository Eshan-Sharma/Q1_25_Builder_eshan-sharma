import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { HelloWorld } from "../target/types/hello_world";

describe("hello-world", () => {
  anchor.setProvider(anchor.AnchorProvider.env());
  const program = anchor.workspace.HelloWorld as Program<HelloWorld>;

  it("Mic testing - Hello world", async () => {
    const tx = await program.methods.initialize().rpc();
    console.log(`Your transaction signature: ${tx}`);
  });
});
//Your transaction signature: 5F87caSEB8TDBxgq2f24a4WBZ7fDHaSBuJc6yJe847YbkCQ2tfc5VdViuoHCB5JSHxdwFcJais6EjNwaTZSRndHt
