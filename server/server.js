import express from 'express';
import dotenv from 'dotenv';
import crypto from 'crypto';
import axios from 'axios';
import bodyParser from 'body-parser';

dotenv.config();

const app = express();
const PORT = 8080;

app.use(bodyParser.json());

// Verify Twitch EventSub signature
function verifySignature(req) {
  const messageId = req.header('Twitch-Eventsub-Message-Id');
  const timestamp = req.header('Twitch-Eventsub-Message-Timestamp');
  const signature = req.header('Twitch-Eventsub-Message-Signature');
  const secret = process.env.TWITCH_WEBHOOK_SECRET;

  const message = messageId + timestamp + JSON.stringify(req.body);
  const hmac = crypto.createHmac('sha256', secret).update(message).digest('hex');
  const expectedSignature = `sha256=${hmac}`;

  return signature === expectedSignature;
}

app.post('/webhook', async (req, res) => {
  if (!verifySignature(req)) return res.status(403).send('Forbidden');

  const messageType = req.header('Twitch-Eventsub-Message-Type');

  if (messageType === 'webhook_callback_verification') {
    return res.status(200).send(req.body.challenge);
  }

  if (messageType === 'notification') {
    const { broadcaster_user_id, user_input } = req.body.event;

    if (user_input) {
      const [champion, category] = user_input.trim().toLowerCase().split(/\s+/);
      if (champion && category) {
        await sendToPubSub(broadcaster_user_id, { champion, category });
      }
    }

    return res.status(200).end();
  }

  return res.status(200).end();
});

async function sendToPubSub(channelId, payload) {
  try {
    await axios.post(
      'https://api.twitch.tv/helix/extensions/pubsub',
      {
        broadcaster_id: channelId,
        message: JSON.stringify(payload),
        target: ['broadcast']
      },
      {
        headers: {
          'Client-ID': process.env.TWITCH_CLIENT_ID,
          Authorization: `Bearer ${process.env.TWITCH_APP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    console.log(`✅ Sent PubSub: ${JSON.stringify(payload)}`);
  } catch (err) {
    console.error('❌ PubSub Error:', err.response?.data || err.message);
  }
}

app.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});
