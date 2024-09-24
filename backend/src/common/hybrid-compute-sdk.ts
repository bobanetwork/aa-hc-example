import express, {Express, NextFunction, Request, Response} from "express";
import {OffchainParameter, selector} from "./utils";
import {JSONRPCServer} from "json-rpc-2.0";
import bodyParser from 'body-parser'

export class HybridComputeSDK {
    private server: any;
    private app: Express|undefined = undefined;

    constructor() {
    }

    public createJsonRpcServerInstance() {
        const server = new JSONRPCServer();
        const app = express();

        app.use(bodyParser.json());
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

        app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
            console.error('RPC Error:', err);
            res.status(400).json({error: err.message});
        });

        this.app = app;
        this.server = server

        return this;
    }

    public addServerAction(
        selectorName: string,
        fun: (params: OffchainParameter) => any
    ) {
        if (this.isServerHealthy()) {
            this.server.addMethod(selector(selectorName), async (params: OffchainParameter) => {
                return fun(params);
            });
        }

        return this;
    }

    public listenAt(port: number) {
        if (this.isServerHealthy()) {
            if (!process.env.JEST_WORKER_ID) {
                this.app!.listen(port, () => {
                    console.log(`RPC server listening at http://localhost:${port}`);
                });
            }
        }

        return this;
    }

    public isServerHealthy() {
        return !!(this.server && this.app);
    }
}