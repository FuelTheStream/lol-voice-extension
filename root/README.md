# LoL Champion Voice Lines – Twitch Extension

This Twitch video overlay extension lets viewers trigger League of Legends champion voice lines by redeeming Channel Points.

## Features

- 🎯 Search and select champions
- 🎙️ Filter by voice line categories: taunt, laugh, joke, death, move, attack, cast, kill
- 🌐 Voice lines hosted via Cloudflare R2
- ⚡ Built with vanilla JS and Twitch Extension SDK

## Setup

1. Place extension files in `/html`, `/css`, and `/js`
2. Host them on a secure HTTPS domain (must match `manifest.json`)
3. Upload `.mp3` files to Cloudflare R2 in the format:
   `/voice-lines/{champion}/{category}{optional_number}.mp3`
4. Whitelist your domain in the manifest
5. Upload `manifest.json` to the Twitch Developer Console and publish

---