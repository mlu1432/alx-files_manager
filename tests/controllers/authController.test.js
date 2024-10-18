// tests/controllers/authController.test.js
import { expect } from 'chai';
import request from 'supertest';
import server from '../../server';
import dbClient from '../../utils/db';
import redisClient from '../../utils/redis';
import sha1 from 'sha1';

describe('AuthController', () => {
  before(async () => {
    await dbClient.db.collection('users').deleteMany({});
    await redisClient.client.flushall();
    await dbClient.db.collection('users').insertOne({
      email: 'bob@dylan.com',
      password: sha1('toto1234!'),
    });
  });

  describe('GET /connect', () => {
    it('should return Unauthorized if credentials are incorrect', (done) => {
      request(server)
        .get('/connect')
        .set('Authorization', 'Basic Ym9iQGR5bGFuLmNvbTp3cm9uZ3Bhc3N3b3Jk')
        .expect(401, { error: 'Unauthorized' }, done);
    });

    it('should return a token if credentials are correct', (done) => {
      request(server)
        .get('/connect')
        .set('Authorization', 'Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=')
        .expect(200)
        .end((err, res) => {
          expect(res.body).to.have.property('token');
          done(err);
        });
    });
  });

  describe('GET /disconnect', () => {
    it('should return Unauthorized if token is missing', (done) => {
      request(server)
        .get('/disconnect')
        .expect(401, { error: 'Unauthorized' }, done);
    });
  });
});
