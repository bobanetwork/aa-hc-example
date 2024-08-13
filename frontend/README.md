# Frontend | HC-AA (Meta Mask Flask)

## Get Started
1. BOBA's Snap is not yet on Metamask's official allowlist. For that reason you need to install the [development build](https://chromewebstore.google.com/detail/metamask-flask-developmen/ljfoeinjpaedjfecbmggjgodbgkmjkjk) in order to use Hybrid Compute via DApps.
2. Disable the production version of Metamask (the orange one) in your browser [extension settings](chrome://extensions/). 
3. For Boba Sepolia head over to our offial AA-HC wallet creation site: [hc-wallet.sepolia.boba.network](https://hc-wallet.sepolia.boba.network/)
4. Once you got your snap account: Choose it in your Metamask and connect on your DApp.

## Deployment / Start DApp
### Docker
1. Copy `.env-template` and rename it to `.env` (adapt your environment vars accordingly).
2. Run `docker-compose up`

Of course you can use the Dockerfile / Docker-Compose to deploy to the cloud of your choice as well.

### Without Docker
1. Run `pnpm i`
2. then `pnpm dev`

### Deploy to production
Of course you can use whichever cloud provider you like. But for demo purposes we have used *render.com* as they provide allow you to deploy a web app for free.

Our demo frontend will spin down with inactivity since we are using the free version. In that case the page might take longer to load.

The demo frontend should be live here (free, so might have some delay on cold starts):
https://aa-hc-example-fe.onrender.com

Also the backend is hosted as free version on Render. So make sure to open https://aa-hc-example.onrender.com/hc/ in Browser once to warm up the server. Otherwise the user operation might fail due to timeout.

If you want to setup your own server on Render, just follow these steps:
1. Create account on [render.com](https://render.com)
2. Click on **New** and choose **Static site**
3. Connect your Git repository with Render
4. If you are using this example repo you need to change the **Root directory** to `frontend/` since the frontend is located there.
5. Set the build command to `pnpm build` and the build folder to `dist/`.
6. Select the instance type you prefer, we chose "Free" for now.
7. Then import your environment variables either one by one or via **Add from .env** import.


Your DApp should be ready!

## Stack 
- Vite 
- React Ts
- [Shadcn UI](https://ui.shadcn.com/docs) 
- [Tailwind Css](https://tailwindcss.com/docs/installation)
