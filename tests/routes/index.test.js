// tests/routes/index.test.js
import { expect } from 'chai';
import request from 'supertest';
import server from '../../server';
import dbClient from '../../utils/db';
import redisClient from '../../utils/redis';

describe('Routes', () => {
  before(async () => {
    await dbClient.db.collection('users').deleteMany({});
    await redisClient.client.flushall();
  });

  describe('GET /status', () => {
    it('should return the status of Redis and DB', (done) => {
      request(server)
        .get('/status')
        .expect(200)
        .end((err, res) => {
          expect(res.body).to.have.property('redis');
          expect(res.body).to.have.property('db');
          done(err);
        });
    });
  });

  describe('GET /stats', () => {
    it('should return the number of users and files', (done) => {
      request(server)
        .get('/stats')
        .expect(200)
        .end((err, res) => {
          expect(res.body).to.have.property('users');
          expect(res.body).to.have.property('files');
          done(err);
        });
    });
  });
});
