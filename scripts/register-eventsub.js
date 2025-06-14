import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const userId = 'your-twitch-user-id'; // Replace this with your broadcaster_user_id
const callbackUrl = 'https://your-public-server.com/webhook'; // Your HTTPS webhook endpoint

async function register() {
  try {
    const res = await axios.post('https://api.twitch.tv/helix/eventsub/subscriptions', {
      type: 'channel.channel_points_custom_reward_redemption.add',
      version: '1',
      condition: {
        broadcaster_user_id: userId
      },
      transport: {
        method: 'webhook',
        callback: callbackUrl,
        secret: process.env.TWITCH_WEBHOOK_SECRET
      }
    }, {
      headers: {
        'Client-ID': process.env.TWITCH_CLIENT_ID,
        Authorization: `Bearer ${process.env.TWITCH_APP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ EventSub Subscription Registered:', res.data);
  } catch (err) {
    console.error('❌ Failed to register EventSub:', err.response?.data || err.message);
  }
}

register();
