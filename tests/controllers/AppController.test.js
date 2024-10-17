// tests/controllers/AppController.test.js
import { expect } from 'chai';
import sinon from 'sinon';
import AppController from '../../controllers/AppController';
import redisClient from '../../utils/redis';
import dbClient from '../../utils/db';

let res;
beforeEach(() => {
  res = {
    status: sinon.stub().returnsThis(),
    json: sinon.spy(),
  };
});

describe('AppController', () => {
  it('should return status of Redis and DB', async () => {
    await AppController.getStatus({}, res);
    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWith({ redis: true, db: true })).to.be.true;
  });

  it('should return stats for users and files', async () => {
    sinon.stub(dbClient, 'nbUsers').returns(10);
    sinon.stub(dbClient, 'nbFiles').returns(20);
    await AppController.getStats({}, res);
    expect(res.status.calledWith(200)).to.be.true;
    expect(res.json.calledWith({ users: 10, files: 20 })).to.be.true;
    dbClient.nbUsers.restore();
    dbClient.nbFiles.restore();
  });
});
