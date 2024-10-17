// tests/controllers/UsersController.test.js
import { expect } from 'chai';
import request from 'supertest';
import server from '../../server';
import dbClient from '../../utils/db';

describe('UsersController', () => {
  before(async () => {
    await dbClient.db.collection('users').deleteMany({});
  });

  after(() => {
    server.close();
  });

  it('should create a new user', async () => {
    const res = await request(server)
      .post('/users')
      .send({ email: 'bob@dylan.com', password: 'toto1234!' });
    expect(res.status).to.equal(201);
    expect(res.body).to.have.property('id');
    expect(res.body).to.have.property('email', 'bob@dylan.com');
  });

  it('should not create a user with missing email', async () => {
    const res = await request(server)
      .post('/users')
      .send({ password: 'toto1234!' });
    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error', 'Missing email');
  });

  it('should not create a user with missing password', async () => {
    const res = await request(server)
      .post('/users')
      .send({ email: 'bob@dylan.com' });
    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error', 'Missing password');
  });

  it('should not create a user that already exists', async () => {
    await request(server)
      .post('/users')
      .send({ email: 'bob@dylan.com', password: 'toto1234!' });
    const res = await request(server)
      .post('/users')
      .send({ email: 'bob@dylan.com', password: 'toto1234!' });
    expect(res.status).to.equal(400);
    expect(res.body).to.have.property('error', 'Already exist');
  });
});
