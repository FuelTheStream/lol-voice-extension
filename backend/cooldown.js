// cooldown.js
const Redis = require('redis');

const COOLDOWN_MINUTES = 30;
const COOLDOWN_SECONDS = COOLDOWN_MINUTES * 60;

class CooldownManager {
  constructor(redisUrl) {
    this.client = Redis.createClient({ url: redisUrl });
    this.client.connect();
  }

  async isOnCooldown(userId) {
    const key = `voice_cooldown:${userId}`;
    const exists = await this.client.exists(key);
    return exists === 1;
  }

  async setCooldown(userId) {
    const key = `voice_cooldown:${userId}`;
    await this.client.setEx(key, COOLDOWN_SECONDS, "1");
  }

  async getCooldown(userId) {
    const key = `voice_cooldown:${userId}`;
    const ttl = await this.client.ttl(key);
    return ttl > 0 ? ttl : 0;
  }
}

module.exports = CooldownManager;
