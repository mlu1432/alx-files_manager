// tests/utils/dbClient.test.js
import { expect } from 'chai';
import dbClient from '../../utils/db';

describe('DBClient', () => {
  it('should confirm that MongoDB client is alive', async () => {
    const isAlive = await dbClient.isAlive();
    expect(isAlive).to.be.true;
  });

  it('should return the number of users in the database', async () => {
    const nbUsers = await dbClient.nbUsers();
    expect(nbUsers).to.be.a('number');
  });

  it('should return the number of files in the database', async () => {
    const nbFiles = await dbClient.nbFiles();
    expect(nbFiles).to.be.a('number');
  });
});
