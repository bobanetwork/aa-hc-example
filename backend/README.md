# OffChain server
This is the offchain API that your smart contract is calling via HybridCompute. 

## Get started
### Docker
1. Copy `.env-template` and rename to `.env` (update the environment variables accordingly)
2. Run `docker-compose up`

Of course you can use the Dockerfile / Docker-Compose to deploy to the cloud of your choice as well.

### Without Docker
1. Run `pnpm i`
2. then `pnpm start`

### Deploy to production
Of course you can use whichever cloud provider you like. But for demo purposes we have used *render.com* as they provide allow you to deploy a tiny backend for free.

Our demo server will spin down with inactivity or due to exceeding the free monthly limit since we are using the free version. In this case your smart contract call will fail. 

The demo server should still be available here: https://aa-hc-example.onrender.com/hc

If you want to setup your own server on Render, just follow these steps: 
1. Create account on [render.com](https://render.com)
2. Click on **New** and choose **Web Service**
3. Connect your Git repository with Render
4. If you are using this example repo you need to change the **Root directory** to `backend/offchain` since the isolated service is located there.
5. Set the build command to `pnpm build`, the start command to `pnpm start`.
6. Select the instance type you prefer, we chose "Free" for now.
7. Then import your environment variables either one by one or via **Add from .env** import.

Then your server should be ready! 