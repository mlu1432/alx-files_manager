// tests/routes/index.test.js
import { expect } from 'chai';
import request from 'supertest';
import server from '../../server';

describe('Routes', () => {
  after(() => {
    server.close();
  });

  it('should handle GET /status', async () => {
    const res = await request(server).get('/status');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('redis');
    expect(res.body).to.have.property('db');
  });

  it('should handle GET /stats', async () => {
    const res = await request(server).get('/stats');
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property('users');
    expect(res.body).to.have.property('files');
  });
});
