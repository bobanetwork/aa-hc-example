# Frontend | HC-AA (Meta Mask Flask)

## Get started
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
