## How Streamers Configure Their Channel Points Reward

1. **Create a Custom Channel Points Reward**
   - Go to your [Twitch Creator Dashboard > Viewer Rewards > Channel Points > Manage Rewards & Challenges](https://dashboard.twitch.tv/u/YOUR_USERNAME/reward-queue)
   - Create a new custom reward for this extension.

2. **Get Your Reward ID**
   - Open browser Dev Tools > Network, then edit your reward and find the ID in the network response.

3. **Configure the Extension**
   - Go to your extension's configuration page (config.html).
   - Paste your Reward ID in the field and save.
   - The Reward ID is saved securely for your channel in Redis.

4. **Done!**
   - Viewers can now redeem the reward to trigger voice lines on your stream.
