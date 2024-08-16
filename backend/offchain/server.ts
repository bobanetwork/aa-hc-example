// @ts-ignore
import express, { Request, Response } from "express";
import { offchainTokenPrice } from "./token-price";
import {JSONRPCServer} from "json-rpc-2.0";
import bodyParser from 'body-parser'

const server = new JSONRPCServer();
const app = express();
const port = process.env.OC_LISTEN_PORT;

app.use(bodyParser.json());

// Add method to the JSON-RPC server
server.addMethod('getprice(string)', async ({ tokenAddress }) => {
  const result = await offchainTokenPrice(tokenAddress);
  console.log("Price result:", result);
  return result;
});

app.post('/hc', (req, res) => {
  const jsonRPCRequest = req.body;

  server.receive(jsonRPCRequest).then((jsonRPCResponse) => {
    if (jsonRPCResponse) {
      res.json(jsonRPCResponse);
    } else {
      res.sendStatus(204);
    }
  });
});

// Global error handler
// @ts-ignore
app.use((err, req, res, next) => {
  console.error('RPC Error:', err);
  res.status(400).json({ error: err.message });
});

if (!process.env.JEST_WORKER_ID) {
  app.listen(port, () => {
    console.log(`RPC server listening at http://localhost:${port}`);
  });
}

export default app;
