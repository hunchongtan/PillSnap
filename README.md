
# PillSnap

**PillSnap** is an AI-powered web app for identifying pills from images. It uses computer vision to detect and crop pills, then leverages OpenAI's **gpt-4o-mini** for identification, returning the most likely matches with confidence scores.

## Features

- Upload an image with one or more pills.
- Automatic detection and cropping of each pill (Roboflow + Sharp).
- AI-powered identification of each pill (OpenAI gpt-4o-mini).
- Displays confidence, generic/brand names, and bounding box details.
- Modern, responsive UI (Next.js, Tailwind, shadcn/ui).

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

## Deployment

- Production build: `npm run build`
- All type and lint errors are resolved except for non-blocking `<img>` warnings (see Next.js docs for optimization).
