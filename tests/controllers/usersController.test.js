// tests/controllers/usersController.test.js
import { expect } from 'chai';
import request from 'supertest';
import server from '../../server';
import dbClient from '../../utils/db';
import redisClient from '../../utils/redis';

describe('UsersController', () => {
  before(async () => {
    await dbClient.db.collection('users').deleteMany({});
    await redisClient.client.flushall();
  });

  describe('POST /users', () => {
    it('should return Missing email if email is not provided', (done) => {
      request(server)
        .post('/users')
        .send({ password: 'password123' })
        .expect(400, { error: 'Missing email' }, done);
    });

    it('should return Missing password if password is not provided', (done) => {
      request(server)
        .post('/users')
        .send({ email: 'alice@example.com' })
        .expect(400, { error: 'Missing password' }, done);
    });

    it('should create a new user if email and password are provided', (done) => {
      request(server)
        .post('/users')
        .send({ email: 'alice@example.com', password: 'password123' })
        .expect(201)
        .end((err, res) => {
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('email', 'alice@example.com');
          done(err);
        });
    });
  });

  describe('GET /users/me', () => {
    it('should return Unauthorized if token is missing', (done) => {
      request(server)
        .get('/users/me')
        .expect(401, { error: 'Unauthorized' }, done);
    });
  });
});
