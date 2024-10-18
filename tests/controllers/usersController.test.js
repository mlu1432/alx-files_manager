import chai from 'chai';
import chaiHttp from 'chai-http';
import sinon from 'sinon';
import app from '../../server';
import dbClient from '../../utils/db';
import Queue from 'bull';

chai.use(chaiHttp);
const { expect } = chai;

describe('UsersController', () => {
  let usersCollection;
  let sandbox;
  let userQueue;

  before(() => {
    usersCollection = dbClient.db.collection('users');
    userQueue = new Queue('userQueue', 'redis://127.0.0.1:6379');
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should create a new user and enqueue a welcome email', (done) => {
    const fakeUser = {
      email: 'testuser@example.com',
      password: 'testpassword',
    };
    const insertOneStub = sandbox.stub(usersCollection, 'insertOne').resolves({
      insertedId: '601c3e0e8e5d1c23a4d2c8e5',
    });
    const userQueueStub = sandbox.stub(userQueue, 'add').resolves();

    chai
      .request(app)
      .post('/users')
      .send(fakeUser)
      .end((err, res) => {
        expect(res).to.have.status(201);
        expect(res.body).to.have.property('id');
        expect(res.body).to.have.property('email', fakeUser.email);
        expect(insertOneStub.calledOnce).to.be.true;
        expect(userQueueStub.calledOnce).to.be.true;
        done();
      });
  });

  it('should return an error if email is missing', (done) => {
    const fakeUser = {
      password: 'testpassword',
    };

    chai
      .request(app)
      .post('/users')
      .send(fakeUser)
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('error', 'Missing email');
        done();
      });
  });

  it('should return an error if password is missing', (done) => {
    const fakeUser = {
      email: 'testuser@example.com',
    };

    chai
      .request(app)
      .post('/users')
      .send(fakeUser)
      .end((err, res) => {
        expect(res).to.have.status(400);
        expect(res.body).to.have.property('error', 'Missing password');
        done();
      });
  });

  it('should return Unauthorized if token is missing for getMe', (done) => {
    chai
      .request(app)
      .get('/users/me')
      .end((err, res) => {
        expect(res).to.have.status(401);
        expect(res.body).to.have.property('error', 'Unauthorized');
        done();
      });
  });

  it('should return user information if token is valid for getMe', async () => {
    // Mocking the redisClient and database response
    const fakeUser = {
      _id: '601c3e0e8e5d1c23a4d2c8e5',
      email: 'testuser@example.com',
    };
    sandbox.stub(dbClient.db.collection('users'), 'findOne').resolves(fakeUser);
    sandbox.stub(redisClient, 'get').resolves(fakeUser._id);

    const token = 'valid-token';

    chai
      .request(app)
      .get('/users/me')
      .set('X-Token', token)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property('id', fakeUser._id);
        expect(res.body).to.have.property('email', fakeUser.email);
        done();
      });
  });
});
