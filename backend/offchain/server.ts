// @ts-ignore
import express, { Request, Response } from "express";
import { offchainTokenPrice } from "./token-price";
import { selector } from "./utils";

const app = express();
const port = process.env.OC_LISTEN_PORT;

app.use(express.json());

app.post("/hc", async (req: Request, res: Response) => {
  console.log('--> reached')
  const { method, params } = req.body;

  if (!method || !params) {
    return res.status(400).json({ error: "Invalid request" });
  }

  try {
    const result = await handleRpcMethod(method, params);
    console.log("FINAL RESULT RETURNING", result);
    return res.json({ result });
  } catch (error: any) {
    return res.status(400).json({ error: error.message });
  }
});

async function handleRpcMethod(method: string, params: any): Promise<unknown> {
  switch (method) {
    // Since the targeting method-name is converted by the calling smart-contract,
    // we need to convert it here aswell.
    case selector("getprice(string)"):
      const res = await offchainTokenPrice(params);
      console.log("inside handleRpcMethod: ", res);
      return res;
    default:
      throw new Error("Offchain RPC: Method not found");
  }
}

if (!process.env.JEST_WORKER_ID) {
  app.listen(port, () => {
    console.log(`RPC server listening at http://localhost:${port}`);
  });
}

export default app;
