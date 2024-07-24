import express, { Request, Response } from 'express';
import { getEnvVars, selector } from './common/utils';
import { offchainTokenPrice } from './offchain/token-price';

const app = express();
const ENV_VARS = getEnvVars();
const port = ENV_VARS.ocListenPort;

app.use(express.json());

app.post('/hc', async (req: Request, res: Response) => {
  const { method, params } = req.body;

  if (!method || !params) {
    return res.status(400).json({ error: 'Invalid request' });
  }

  try {
    const result = await handleRpcMethod(method, params);
    return res.json({ result });
  } catch (error: unknown) {
    return res.status(500).send(error)
  }
});

async function handleRpcMethod(method: string, params: any): Promise<unknown> {
  switch (method) {
    case selector("getprice(string)"):
      return await offchainTokenPrice(params);
    default:
      throw new Error('Method not found');
  }
}

if (!process.env.JEST_WORKER_ID) {
  app.listen(port, () => {
    console.log(`RPC server listening at http://localhost:${port}`);
  });
}

export default app;