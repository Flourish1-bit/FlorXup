<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/dbb3449b-c9ad-45b6-b871-148723713ab1

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deploy to Cloudflare Pages

This project is configured as a Cloudflare Pages site. For a Pages Git integration, set the build command to `npm run build` and the output directory to `dist`. Pages deploys the build output automatically, so leave the deploy command empty.

For a separate CI job or a direct-upload workflow, build first and then run `npm run deploy`. The `CLOUDFLARE_API_TOKEN` used by that job must belong to the account that owns the `florxup` Pages project and include the `Account > Cloudflare Pages > Edit` permission. It must also be configured in the deployment environment, not only in a local `.env` file. A token with only read access, user access, or Worker permissions will fail with API error `10000` when Wrangler checks the Pages project.

If the job still reports an authentication error, verify that `CLOUDFLARE_API_TOKEN` is not an expired or stale token and that the `florxup` project exists in the token's account. Do not replace the token with a Global API Key. Do not use `npx wrangler deploy`, which is the Worker deployment command and does not use the Pages output configuration.

## Backend

The first backend slice is a standalone Node.js API with email-based authentication, hashed passwords, JWT access tokens, user search, and an authenticated WebSocket endpoint.

1. Copy `.env.example` to `.env` and set a long random `JWT_SECRET`.
2. Start the API with `npm run server:dev`.
3. The API runs at `http://localhost:4000`; check `GET /health` to verify it is running.

Available routes:

- `POST /auth/signup`
- `POST /auth/login`
- `GET /auth/me`
- `GET /users/search?email=`
- `WS /ws?token=<access-token>`

Development data is stored in `data/backend.json`. It contains password hashes, never plaintext passwords. PostgreSQL, email delivery, media storage, Redis, and production WebSocket fan-out are intentionally deferred to the next backend slice.
