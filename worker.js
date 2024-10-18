import Queue from 'bull';
import { promises as fs } from 'fs';
import { ObjectID } from 'mongodb';
import dbClient from './utils/db';
import imageThumbnail from 'image-thumbnail';

// Create a Bull queue to handle image file processing
const fileQueue = new Queue('fileQueue', 'redis://127.0.0.1:6379');

// Create a Bull queue to handle new user welcome emails
const userQueue = new Queue('userQueue', 'redis://127.0.0.1:6379');

// Process jobs in the fileQueue (image thumbnails)
fileQueue.process(async (job, done) => {
  try {
    const { userId, fileId } = job.data;

    // Validate the job data
    if (!fileId) {
      throw new Error('Missing fileId');
    }
    if (!userId) {
      throw new Error('Missing userId');
    }

    // Retrieve the file document from the database
    const filesCollection = dbClient.db.collection('files');
    const file = await filesCollection.findOne({ _id: new ObjectID(fileId), userId: new ObjectID(userId) });

    // If file not found, throw an error
    if (!file) {
      throw new Error('File not found');
    }

    // Generate image thumbnails (100px, 250px, 500px) and store them
    const sizes = [100, 250, 500];
    for (const size of sizes) {
      const thumbnail = await imageThumbnail(file.localPath, { width: size });
      const thumbnailPath = `${file.localPath}_${size}`;
      await fs.writeFile(thumbnailPath, thumbnail);
    }

    // Finish the job successfully
    done();
  } catch (error) {
    // Log and fail the job with error message
    console.error(`Error processing job ${job.id}:`, error.message);
    done(new Error(error.message));
  }
});

// Process jobs in the userQueue (sending welcome emails)
userQueue.process(async (job, done) => {
  try {
    const { userId } = job.data;

    // Validate the job data
    if (!userId) {
      throw new Error('Missing userId');
    }

    // Retrieve the user document from the database
    const usersCollection = dbClient.db.collection('users');
    const user = await usersCollection.findOne({ _id: new ObjectID(userId) });

    // If user not found, throw an error
    if (!user) {
      throw new Error('User not found');
    }

    // Print the welcome message to the console
    console.log(`Welcome ${user.email}!`);

    // Finish the job successfully
    done();
  } catch (error) {
    // Log and fail the job with error message
    console.error(`Error processing job ${job.id}:`, error.message);
    done(new Error(error.message));
  }
});

// Event listeners for fileQueue events
fileQueue.on('completed', (job) => {
  console.log(`File job ${job.id} completed successfully`);
});

fileQueue.on('failed', (job, err) => {
  console.error(`File job ${job.id} failed with error: ${err.message}`);
});

// Event listeners for userQueue events
userQueue.on('completed', (job) => {
  console.log(`User job ${job.id} completed successfully`);
});

userQueue.on('failed', (job, err) => {
  console.error(`User job ${job.id} failed with error: ${err.message}`);
});

export { fileQueue, userQueue };
