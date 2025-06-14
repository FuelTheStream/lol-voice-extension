require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const axios = require('axios');

const {
  PORT = 3000,
  TWITCH_CLIENT_ID,
  TWITCH_CLIENT_SECRET,
  TWITCH_EVENTSUB_SECRET,
  TWITCH_EXTENSION_ID
} = process.env;

const app = express();
app.use(bodyParser.json({
  verify: (req, res, buf) => { req.rawBody = buf; }
}));

function verifySignature(req) {
  const id = req.get('Twitch-Eventsub-Message-Id');
  const ts = req.get('Twitch-Eventsub-Message-Timestamp');
  const sig = req.get('Twitch-Eventsub-Message-Signature');
  const hmac = crypto.createHmac('sha256', TWITCH_EVENTSUB_SECRET)
    .update(id + ts + req.rawBody)
    .digest('hex');
  return sig === `sha256=${hmac}`;
}

app.post('/eventsub', async (req, res) => {
  if (!verifySignature(req)) return res.status(403).send('Invalid signature');

  const msgType = req.get('Twitch-Eventsub-Message-Type');
  if (msgType === 'webhook_callback_verification') {
    return res.status(200).send(req.body.challenge);
  }

  if (msgType === 'notification' &&
      req.body.subscription.type === 'channel.channel_points_custom_reward_redemption.add') {

    const redemption = req.body.event;
    // fetch app token
    const tokenResp = await axios.post('https://id.twitch.tv/oauth2/token', null, {
      params: {
        client_id: TWITCH_CLIENT_ID,
        client_secret: TWITCH_CLIENT_SECRET,
        grant_type: 'client_credentials'
      }
    });
    const appToken = tokenResp.data.access_token;

    // publish to extension PubSub
    await axios.post(
      `https://api.twitch.tv/extensions/message/${TWITCH_EXTENSION_ID}`,
      {
        content_type: 'application/json',
        message: {
          type: 'redemption',
          rewardId: redemption.reward.id,
          user: redemption.user.display_name
        },
        targets: ['broadcast']
      },
      {
        headers: {
          'Client-Id': TWITCH_CLIENT_ID,
          'Authorization': `Bearer ${appToken}`
        }
      }
    );

    return res.status(200).send();
  }

  res.status(204).send();
});

app.listen(PORT, () => {
  console.log(`EventSub server listening on port ${PORT}`);
});
