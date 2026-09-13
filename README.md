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

This project is configured as a Cloudflare Pages site. Build it with `npm run build`, then deploy the generated `dist` directory with `npm run deploy`.

If using a Cloudflare dashboard deploy command, set it to `npm run deploy` (or `npx wrangler pages deploy dist --project-name florxup`). Do not use `npx wrangler deploy`, which is the Worker deployment command and does not use the Pages output configuration.

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
