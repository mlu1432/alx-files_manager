// tests/utils/redisClient.test.js
import { expect } from 'chai';
import redisClient from '../../utils/redis';

describe('RedisClient', () => {
  before(() => {
    redisClient.client.flushall();
  });

  it('should confirm that Redis client is alive', () => {
    expect(redisClient.isAlive()).to.be.true;
  });

  it('should set and get a key-value pair', async () => {
    await redisClient.set('testKey', 'testValue', 10);
    const value = await redisClient.get('testKey');
    expect(value).to.equal('testValue');
  });

  it('should delete a key', async () => {
    await redisClient.set('testKey', 'testValue', 10);
    await redisClient.del('testKey');
    const value = await redisClient.get('testKey');
    expect(value).to.be.null;
  });
});
