require('dotenv').config();
const axios = require('axios');

const {
  TWITCH_CLIENT_ID,
  TWITCH_CLIENT_SECRET,
  BROADCASTER_USER_ID
} = process.env;

const rewardConfig = {
  title: "Play LoL Voice Line",
  cost: 100,
  prompt: "Redeem to play a random champion voice line",
  is_enabled: true
};

async function getToken() {
  const res = await axios.post('https://id.twitch.tv/oauth2/token', null, {
    params: {
      client_id: TWITCH_CLIENT_ID,
      client_secret: TWITCH_CLIENT_SECRET,
      grant_type: 'client_credentials'
    }
  });
  return res.data.access_token;
}

(async () => {
  const token = await getToken();
  const headers = {
    'Client-ID': TWITCH_CLIENT_ID,
    'Authorization': `Bearer ${token}`
  };

  const listRes = await axios.get(
    `https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${BROADCASTER_USER_ID}`,
    { headers }
  );

  const existing = listRes.data.data.find(r => r.title === rewardConfig.title);

  if (existing) {
    await axios.patch(
      `https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${BROADCASTER_USER_ID}&id=${existing.id}`,
      {
        cost: rewardConfig.cost,
        prompt: rewardConfig.prompt,
        is_enabled: rewardConfig.is_enabled
      },
      { headers }
    );
    console.log('Updated existing reward');
  } else {
    await axios.post(
      `https://api.twitch.tv/helix/channel_points/custom_rewards?broadcaster_id=${BROADCASTER_USER_ID}`,
      {
        title: rewardConfig.title,
        cost: rewardConfig.cost,
        prompt: rewardConfig.prompt,
        is_enabled: rewardConfig.is_enabled
      },
      { headers }
    );
    console.log('Created new reward');
  }
})();
