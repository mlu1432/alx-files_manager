import { createClient } from 'redis';
import { promisify } from 'util';

class RedisClient {
  constructor() {
    this.client = createClient();
    
    // Handle error events from the Redis client
    this.client.on('error', (err) => console.error('Redis Client Error', err));
    
    // Promisify the get, set, and del commands to use async/await
    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  /**
   * Check if the Redis client connection is active
   * @returns {boolean} true if the connection is alive, false otherwise
   */
  isAlive() {
    return this.client.connected;
  }

  /**
   * Get a value associated with a key from Redis
   * @param {string} key - The key in Redis to retrieve
   * @returns {Promise<string>} - The value stored in Redis or null
   */
  async get(key) {
    return this.getAsync(key);
  }

  /**
   * Set a key-value pair in Redis with an expiration time
   * @param {string} key - The key to set
   * @param {string|number} value - The value to set
   * @param {number} duration - The time in seconds for the key to expire
   * @returns {Promise<void>}
   */
  async set(key, value, duration) {
    await this.setAsync(key, value, 'EX', duration);
  }

  /**
   * Delete a key from Redis
   * @param {string} key - The key to delete
   * @returns {Promise<void>}
   */
  async del(key) {
    await this.delAsync(key);
  }
}

// Create and export an instance of RedisClient
const redisClient = new RedisClient();
export default redisClient;
