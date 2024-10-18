import { expect } from 'chai';
import Queue from 'bull';
import sinon from 'sinon';
import fileQueue from '../worker_for_image_thumbnails';
import dbClient from '../utils/db';
import fs from 'fs';
import imageThumbnail from 'image-thumbnail';

describe('worker_for_image_thumbnails', () => {
  let sandbox;
  let filesCollection;

  before(() => {
    filesCollection = dbClient.db.collection('files');
  });

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should process a job to generate thumbnails', async () => {
    // Stub the collection findOne method
    const fakeFile = {
      _id: '601c3e0e8e5d1c23a4d2c8e5',
      userId: '601c3e0e8e5d1c23a4d2c8e6',
      localPath: '/tmp/files_manager/test_image.png',
    };
    sandbox.stub(filesCollection, 'findOne').resolves(fakeFile);

    // Stub fs writeFile and image-thumbnail generate method
    const fsWriteStub = sandbox.stub(fs.promises, 'writeFile').resolves();
    const imageThumbnailStub = sandbox.stub(imageThumbnail, 'default').resolves('thumbnail_data');

    const job = {
      id: '123',
      data: {
        userId: fakeFile.userId,
        fileId: fakeFile._id,
      },
    };

    const done = sandbox.stub();

    // Run the process function
    await fileQueue.process(job, done);

    expect(fsWriteStub.callCount).to.equal(3);
    expect(imageThumbnailStub.callCount).to.equal(3);
    expect(done.calledWith()).to.be.true;
  });

  it('should fail the job if fileId is missing', async () => {
    const job = {
      id: '124',
      data: {
        userId: '601c3e0e8e5d1c23a4d2c8e6',
      },
    };
    const done = sinon.stub();

    await fileQueue.process(job, done);

    expect(done.calledOnce).to.be.true;
    expect(done.args[0][0]).to.be.an.instanceOf(Error);
    expect(done.args[0][0].message).to.equal('Missing fileId');
  });

  it('should fail the job if userId is missing', async () => {
    const job = {
      id: '125',
      data: {
        fileId: '601c3e0e8e5d1c23a4d2c8e5',
      },
    };
    const done = sinon.stub();

    await fileQueue.process(job, done);

    expect(done.calledOnce).to.be.true;
    expect(done.args[0][0]).to.be.an.instanceOf(Error);
    expect(done.args[0][0].message).to.equal('Missing userId');
  });

  it('should fail the job if file is not found', async () => {
    // Stub the collection findOne method to return null
    sandbox.stub(filesCollection, 'findOne').resolves(null);

    const job = {
      id: '126',
      data: {
        userId: '601c3e0e8e5d1c23a4d2c8e6',
        fileId: '601c3e0e8e5d1c23a4d2c8e5',
      },
    };
    const done = sinon.stub();

    await fileQueue.process(job, done);

    expect(done.calledOnce).to.be.true;
    expect(done.args[0][0]).to.be.an.instanceOf(Error);
    expect(done.args[0][0].message).to.equal('File not found');
  });
});
