// tests/controllers/filesController.test.js
import { expect } from 'chai';
import request from 'supertest';
import server from '../../server';
import dbClient from '../../utils/db';
import redisClient from '../../utils/redis';
import sha1 from 'sha1';

describe('FilesController', () => {
  let authToken = '';
  let userId = '';

  before(async () => {
    await dbClient.db.collection('users').deleteMany({});
    await redisClient.client.flushall();

    // Create a user
    const result = await dbClient.db.collection('users').insertOne({
      email: 'bob@dylan.com',
      password: sha1('toto1234!'),
    });
    userId = result.insertedId.toString();

    // Get auth token
    const res = await request(server)
      .get('/connect')
      .set('Authorization', 'Basic Ym9iQGR5bGFuLmNvbTp0b3RvMTIzNCE=');
    authToken = res.body.token;
  });

  describe('POST /files', () => {
    it('should return Unauthorized if no token is provided', (done) => {
      request(server)
        .post('/files')
        .send({ name: 'myText.txt', type: 'file', data: 'SGVsbG8gV29ybGQ=' })
        .expect(401, { error: 'Unauthorized' }, done);
    });

    it('should return Missing name if name is not provided', (done) => {
      request(server)
        .post('/files')
        .set('X-Token', authToken)
        .send({ type: 'file', data: 'SGVsbG8gV29ybGQ=' })
        .expect(400, { error: 'Missing name' }, done);
    });

    it('should create a new folder', (done) => {
      request(server)
        .post('/files')
        .set('X-Token', authToken)
        .send({ name: 'myFolder', type: 'folder' })
        .expect(201)
        .end((err, res) => {
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('name', 'myFolder');
          expect(res.body).to.have.property('type', 'folder');
          done(err);
        });
    });

    it('should create a new file', (done) => {
      request(server)
        .post('/files')
        .set('X-Token', authToken)
        .send({ name: 'myText.txt', type: 'file', data: 'SGVsbG8gV29ybGQ=' })
        .expect(201)
        .end((err, res) => {
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('name', 'myText.txt');
          expect(res.body).to.have.property('type', 'file');
          done(err);
        });
    });
  });
});
