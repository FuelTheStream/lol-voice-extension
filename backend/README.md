# LoL Champion Voice Lines Twitch Extension

## Features

- Viewers redeem Channel Points to trigger League of Legends champion voice lines on stream.
- 30-minute per-viewer cooldown enforced (via Redis).
- Channel Points refunded if redeemed during cooldown.
- Overlay audio played via Twitch Extensions PubSub (JWT).
- Cooldown timer and toast warning in panel UI.
- Pure-text, neon green/black theme.

## Backend Setup

1. Copy `.env.example` to `.env` and set all required secrets/IDs.
2. Run `npm install` to install dependencies.
3. Make sure Redis is running and accessible at the specified `REDIS_URL`.
4. Start the backend server:  
5. Register your `/eventsub` webhook endpoint with Twitch for Channel Points redemption.

## Frontend (Panel)

- Place `panel.html`, `panel.js`, and `style.css` in your extension's `html/` folder.
- Store `champions.json` and voice lines as described in the docs above.
- The panel auto-disables the play button and shows a timer when the viewer is on cooldown.

## Test

See `test/` folder for example EventSub payloads and cooldown API testing scripts.

## License

MIT
# lol-voice-extension
