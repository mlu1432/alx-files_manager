// tests/server.test.js
import { expect } from 'chai';
import request from 'supertest';
import server from '../server';

describe('Server', () => {
  after(() => {
    server.close();
  });

  it('should return status of Redis and DB', async () => {
    const res = await request(server).get('/status');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('redis');
    expect(res.body).to.have.property('db');
  });

  it('should return stats for users and files', async () => {
    const res = await request(server).get('/stats');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('users');
    expect(res.body).to.have.property('files');
  });
});
