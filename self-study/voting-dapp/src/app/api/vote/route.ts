import {
  ActionGetResponse,
  ActionPostRequest,
  ACTIONS_CORS_HEADERS,
  createPostResponse,
} from "@solana/actions";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import { BN, Program } from "@coral-xyz/anchor";
import { Voting } from "../../../../anchor/target/types/voting";
const IDL = require("../../../../anchor/target/idl/voting.json");

export const OPTIONS = GET;
export async function GET(request: Request) {
  const actionMetadata: ActionGetResponse = {
    icon: "https://www.crazyrichards.com/wp-content/uploads/2020/10/peanut-butter-PB3M56S-scaled.jpg",
    title: "Vote for your favorite peanut butter",
    description: "Vote between crunchy and smooth peanut butter",
    label: "Vote",
    links: {
      actions: [
        {
          href: "/api/vote?candidate=Crunchy",
          label: "Vote for Crunchy",
          type: "message",
        },
        {
          href: "/api/vote?candidate=Smooth",
          label: "Vote for Smooth",
          type: "message",
        },
      ],
    },
  };
  return Response.json(actionMetadata, { headers: ACTIONS_CORS_HEADERS });
}

export async function POST(request: Request) {
  const url = new URL(request.url);
  const candidate = url.searchParams.get("candidate");

  if (candidate !== "Crunchy" && candidate !== "Smooth") {
    return new Response("Invalid candidate", {
      status: 400,
      headers: ACTIONS_CORS_HEADERS,
    });
  }

  const connection = new Connection("https://127.0.0.1:8899", "confirmed");
  const program: Program<Voting> = new Program(IDL, { connection });
  const body: ActionPostRequest = await request.json();
  let voter = new PublicKey(body.account);
  try {
    voter = new PublicKey(body.account);
  } catch (error) {
    return new Response("Invalid account", {
      status: 400,
      headers: ACTIONS_CORS_HEADERS,
    });
  }

  const instruction = await program.methods
    .vote(candidate, new BN(1))
    .accounts({
      signer: voter,
    })
    .instruction();

  const blockhash = await connection.getLatestBlockhash();
  const transaction = new Transaction({
    feePayer: voter,
    blockhash: blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight,
  }).add(instruction);

  const response = await createPostResponse({
    fields: { transaction: transaction },
  });

  return Response.json(response, { headers: ACTIONS_CORS_HEADERS });
}
