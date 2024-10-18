import chai from 'chai';
import chaiHttp from 'chai-http';
import { expect } from 'chai';
import { describe, it, before } from 'mocha';
import server from '../../server';
import dbClient from '../../utils/db';

chai.use(chaiHttp);

let authToken;

// Before running tests, ensure database is connected and a user is created
before(async () => {
  await dbClient.connect();
  // Create a test user in the database
  await dbClient.db.collection('users').insertOne({
    email: 'testuser@example.com',
    password: 'hashed_password', // Assume it's already hashed
  });

  // Get an authentication token
  const res = await chai.request(server)
    .get('/connect')
    .set('Authorization', 'Basic dGVzdHVzZXJAZXhhbXBsZS5jb206cGFzc3dvcmQ='); // Base64 for "testuser@example.com:password"
  authToken = res.body.token;
});

describe('Routes', () => {
  /** Application Status Routes **/
  describe('GET /status', () => {
    it('should return the status of the API', (done) => {
      chai.request(server)
        .get('/status')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('redis');
          expect(res.body).to.have.property('db');
          done(err);
        });
    });
  });

  describe('GET /stats', () => {
    it('should return statistics about the database', (done) => {
      chai.request(server)
        .get('/stats')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('users');
          expect(res.body).to.have.property('files');
          done(err);
        });
    });
  });

  /** User Management Routes **/
  describe('POST /users', () => {
    it('should create a new user', (done) => {
      chai.request(server)
        .post('/users')
        .send({ email: 'newuser@example.com', password: 'newpassword' })
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('email').eql('newuser@example.com');
          done(err);
        });
    });

    it('should return an error if email is missing', (done) => {
      chai.request(server)
        .post('/users')
        .send({ password: 'password' })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('error').eql('Missing email');
          done(err);
        });
    });
  });

  describe('GET /users/me', () => {
    it('should return user information if token is valid', (done) => {
      chai.request(server)
        .get('/users/me')
        .set('X-Token', authToken)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('email').eql('testuser@example.com');
          done(err);
        });
    });

    it('should return Unauthorized if token is missing', (done) => {
      chai.request(server)
        .get('/users/me')
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('error').eql('Unauthorized');
          done(err);
        });
    });
  });

  /** Authentication Routes **/
  describe('GET /connect', () => {
    it('should return Unauthorized if credentials are incorrect', (done) => {
      chai.request(server)
        .get('/connect')
        .set('Authorization', 'Basic d3Jvbmd1c2VyOnBhc3N3b3Jk')
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('error').eql('Unauthorized');
          done(err);
        });
    });

    it('should return a token if credentials are correct', (done) => {
      chai.request(server)
        .get('/connect')
        .set('Authorization', 'Basic dGVzdHVzZXJAZXhhbXBsZS5jb206cGFzc3dvcmQ=')
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property('token');
          done(err);
        });
    });
  });

  describe('GET /disconnect', () => {
    it('should return Unauthorized if token is missing', (done) => {
      chai.request(server)
        .get('/disconnect')
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('error').eql('Unauthorized');
          done(err);
        });
    });

    it('should disconnect the user if token is valid', (done) => {
      chai.request(server)
        .get('/disconnect')
        .set('X-Token', authToken)
        .end((err, res) => {
          expect(res).to.have.status(204);
          done(err);
        });
    });
  });

  /** File Management Routes **/
  describe('POST /files', () => {
    it('should upload a new file', (done) => {
      chai.request(server)
        .post('/files')
        .set('X-Token', authToken)
        .send({ name: 'testfile.txt', type: 'file', data: 'SGVsbG8gd29ybGQ=' })
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property('id');
          expect(res.body).to.have.property('name').eql('testfile.txt');
          done(err);
        });
    });

    it('should return an error if name is missing', (done) => {
      chai.request(server)
        .post('/files')
        .set('X-Token', authToken)
        .send({ type: 'file', data: 'SGVsbG8gd29ybGQ=' })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property('error').eql('Missing name');
          done(err);
        });
    });
  });

  describe('GET /files/:id', () => {
    it('should return Unauthorized if token is missing', (done) => {
      chai.request(server)
        .get('/files/12345')
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('error').eql('Unauthorized');
          done(err);
        });
    });
  });

  describe('PUT /files/:id/publish', () => {
    it('should return Unauthorized if token is missing', (done) => {
      chai.request(server)
        .put('/files/12345/publish')
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('error').eql('Unauthorized');
          done(err);
        });
    });
  });

  describe('PUT /files/:id/unpublish', () => {
    it('should return Unauthorized if token is missing', (done) => {
      chai.request(server)
        .put('/files/12345/unpublish')
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('error').eql('Unauthorized');
          done(err);
        });
    });
  });

  describe('GET /files/:id/data', () => {
    it('should return Unauthorized if token is missing', (done) => {
      chai.request(server)
        .get('/files/12345/data')
        .end((err, res) => {
          expect(res).to.have.status(401);
          expect(res.body).to.have.property('error').eql('Unauthorized');
          done(err);
        });
    });
  });
});
