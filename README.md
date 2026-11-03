# Motion Studio — AI Video Generator

This is a Next.js App Router starter with a prompt dashboard and a server-side Replicate API integration.

## Before you start

- Install Node.js 20.9 or newer.
- Have a Replicate account with API access and billing enabled.
- Video generation is not free by default. Check current model pricing before running jobs.

## Exact setup in VS Code

1. Extract the ZIP.
2. Open the `ai-video-studio` folder in VS Code (the folder that contains `package.json`).
3. Open Terminal → New Terminal and run:

   ```bash
   npm install
   ```

4. In the root folder (same level as `package.json`), create a file named `.env.local`.
5. Paste the following line into `.env.local` and replace the placeholder with your real token:

   ```env
   REPLICATE_API_TOKEN=r8_your_real_token_here
   ```

   Create a token here: https://replicate.com/account/api-tokens

   Keep the token private. Never add it to client-side code or commit `.env.local` to Git.

6. You do not need to set model owner/name: the app defaults to `alibaba/wan-3-prime`. You can override with `REPLICATE_MODEL_OWNER` and `REPLICATE_MODEL_NAME`, but do not do that unless you know the selected model's API schema.
7. Stop any old development server with Ctrl+C, then restart:

   ```bash
   npm run dev
   ```

8. Open http://localhost:3000, enter a descriptive prompt and click **Generate video**.

## If you see the missing-token message

- Check the filename is exactly `.env.local` — not `.env.local.txt`.
- Make sure it is in the project root, not inside `app/` or `app/api/`.
- Make sure the token value is real, not the placeholder text.
- Save the file and restart `npm run dev`.
- Never share your API token in chat or screenshots.

## If generation starts but fails

The app will show the provider error. Check:
- Token is active and belongs to your Replicate account.
- Your Replicate account has billing/payment configured and enough balance.
- The model is available: https://replicate.com/alibaba/wan-3-prime
- Model input schema and current pricing on the model page.
- The terminal where `npm run dev` is running for server logs.

Wan 3.0 Prime accepts `prompt`, `duration` (2–30 seconds), `resolution` (`480p`, `720p`, `1080p`), `aspect_ratio` (`adaptive`, `16:9`, `9:16`, `1:1`, `4:3`, `3:4`), `negative_prompt`, and `enable_prompt_expansion`. The UI exposes a subset of these settings.

## Important limitations

This starter generates a single video clip per request. It does not yet include database-backed history, login, permanent cloud storage, user billing, or a multi-scene editor. Generated output links may be temporary. For a public deployment, add authentication, rate limiting, request quotas and secure storage.

## Existing shadcn project

If you already have a Next.js + shadcn project, do not replace all its config files. Copy `app/page.tsx`, `app/globals.css`, and `app/api/generate-video/route.ts` into your project, install `lucide-react` if needed, and keep your existing `app/layout.tsx` if it already imports `globals.css`.
