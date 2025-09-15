
# PillSnap

**PillSnap** is an AI-powered web app for extracting pill attributes from an image and searching a local database for likely matches. It uses computer vision to detect and crop pills, then leverages OpenAI's **gpt-4o-mini** for attribute extraction; the database search derives confidence scores.

## Features

- Upload an image with one or more pills.
- Automatic detection and cropping of each pill (Roboflow + Sharp).
- AI-powered identification of each pill (OpenAI gpt-4o-mini).
- Displays confidence, generic/brand names, and bounding box details.
- Modern, responsive UI (Next.js, Tailwind, shadcn/ui).

## Demo  
Try it live here: [pill-snap.vercel.app](https://pill-snap.vercel.app/)

## Usage

1. Clone the repo and install dependencies:
	```bash
	npm install
	```
2. Set up your `.env` file with required API keys (see `.env.example`).
3. Start the dev server:
	```bash
	npm run dev
	```
4. Visit [http://localhost:3000](http://localhost:3000).

## Architecture

- **Detection:** Roboflow API for bounding boxes.
- **Cropping:** Server-side with Sharp.
- **Identification:** OpenAI gpt-4o-mini (Vision).
- **Frontend:** Next.js App Router, React, Tailwind, shadcn/ui.

## Scripts

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint check
- `npm run typecheck` — TypeScript types only
- `npm run check` — Lint + typecheck
- `npm run format` — Prettier format

## Environment

Copy `.env.example` to `.env.local` and fill the values. Server variables are validated at runtime via Zod in `lib/env.ts`.

## Camera Capture

You can now capture pill photos directly from your device:

- "Take Photo" opens a webcam / device camera dialog implemented via `getUserMedia`.
- Default camera selection: rear ("environment") on mobile, front ("user") on desktop; a Flip button lets you toggle.
- Captured frames are compressed (`canvas.toDataURL('image/jpeg', 0.92)`) and limited to ~10MB before being sent through the same pipeline as standard uploads ( `/api/segment` → crop → `/api/analyze` / attributes ).
- Permissions: the browser will prompt for camera access. If denied, an inline message appears and you can still use file upload.

### Requirements

- Must be served over `https://` or `http://localhost` for camera access.
- Environment variables: `ROBOFLOW_MODEL_URL` and `ROBOFLOW_API_KEY` must be set (already required for segmentation) and are reused for camera captures.

### Accessibility & Behavior

- Dialog is keyboard navigable; `Escape` closes it.
- Video uses `playsInline` to avoid iOS full-screen takeover.
- A hidden `<canvas>` element performs the capture/compression.

