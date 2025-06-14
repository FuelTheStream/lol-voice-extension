# LoL Voice Extension

## Overview
A Twitch Extension that lets viewers trigger League of Legends champion voice lines via Channel Points.

## Structure

- **html/**  
  Front-end (Panel, Config, Overlay) → deployed on Cloudflare Pages
- **server/**  
  Node/Express EventSub & PubSub backend
- **scripts/**  
  Utilities: upload to R2, manage channel-point rewards
- **manifest.json**  
  Twitch Extension manifest
- **wrangler.toml**  
  (Optional) for deploying as a Cloudflare Worker
- **.env.example**  
  Sample environment variables

## Setup

### Front-end
```bash
cd html
npm ci
npm run build
