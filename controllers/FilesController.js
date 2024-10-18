import { v4 as uuidv4 } from 'uuid';
import { promises as fs } from 'fs';
import { ObjectID } from 'mongodb';
import mime from 'mime-types';
import Queue from 'bull';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

// Initialize a queue for file processing tasks
const fileQueue = new Queue('fileQueue', 'redis://127.0.0.1:6379');

class FilesController {

  // Retrieve the user based on token
  static async getUser(request) {
    const token = request.header('X-Token');
    const key = `auth_${token}`;
    const userId = await redisClient.get(key);

    if (userId) {
      const users = dbClient.db.collection('users');
      const idObject = new ObjectID(userId);
      const user = await users.findOne({ _id: idObject });

      if (!user) return null;

      return user;
    }
    return null;
  }

  // Endpoint to upload a new file
  static async postUpload(request, response) {
    const user = await FilesController.getUser(request);
    if (!user) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    const { name, type, parentId, data } = request.body;
    const isPublic = request.body.isPublic || false;

    // Validate required fields
    if (!name) {
      return response.status(400).json({ error: 'Missing name' });
    }
    if (!type) {
      return response.status(400).json({ error: 'Missing type' });
    }
    if (type !== 'folder' && !data) {
      return response.status(400).json({ error: 'Missing data' });
    }

    const files = dbClient.db.collection('files');

    // Check if parent exists and is a folder
    if (parentId) {
      const idObject = new ObjectID(parentId);
      const file = await files.findOne({ _id: idObject, userId: user._id });
      if (!file) {
        return response.status(400).json({ error: 'Parent not found' });
      }
      if (file.type !== 'folder') {
        return response.status(400).json({ error: 'Parent is not a folder' });
      }
    }

    // Handle folder creation
    if (type === 'folder') {
      files.insertOne({
        userId: user._id,
        name,
        type,
        parentId: parentId || 0,
        isPublic,
      }).then((result) => response.status(201).json({
        id: result.insertedId,
        userId: user._id,
        name,
        type,
        isPublic,
        parentId: parentId || 0,
      })).catch((error) => {
        console.error('Error inserting folder:', error);
      });
    } else {
      // Handle file creation
      const filePath = process.env.FOLDER_PATH || '/tmp/files_manager';
      const fileName = `${filePath}/${uuidv4()}`;
      const buff = Buffer.from(data, 'base64');

      try {
        // Create directory if it doesn't exist
        try {
          await fs.mkdir(filePath, { recursive: true });
        } catch (error) {
          // Ignore if directory already exists
        }

        // Write file to local storage
        await fs.writeFile(fileName, buff);
      } catch (error) {
        console.error('Error writing file to disk:', error);
      }

      // Insert file document into DB
      files.insertOne({
        userId: user._id,
        name,
        type,
        isPublic,
        parentId: parentId || 0,
        localPath: fileName,
      }).then((result) => {
        response.status(201).json({
          id: result.insertedId,
          userId: user._id,
          name,
          type,
          isPublic,
          parentId: parentId || 0,
        });

        // Add image processing task to queue if the file is an image
        if (type === 'image') {
          fileQueue.add({
            userId: user._id,
            fileId: result.insertedId,
          });
        }
      }).catch((error) => console.error('Error inserting file:', error));
    }
    return null;
  }

  // Retrieve file information by ID
  static async getShow(request, response) {
    const user = await FilesController.getUser(request);
    if (!user) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    const fileId = request.params.id;
    const files = dbClient.db.collection('files');
    const idObject = new ObjectID(fileId);
    const file = await files.findOne({ _id: idObject, userId: user._id });

    if (!file) {
      return response.status(404).json({ error: 'Not found' });
    }

    return response.status(200).json(file);
  }

  // Retrieve list of files based on parentId and pagination
  static async getIndex(request, response) {
    const user = await FilesController.getUser(request);
    if (!user) {
      return response.status(401).json({ error: 'Unauthorized' });
    }

    const { parentId, page } = request.query;
    const pageNum = parseInt(page, 10) || 0;
    const files = dbClient.db.collection('files');

    let query = { userId: user._id };
    if (parentId) {
      query.parentId = ObjectID(parentId);
    }

    // Use MongoDB aggregation to support pagination
    files.aggregate([
      { $match: query },
      { $sort: { _id: -1 } },
      {
        $facet: {
          metadata: [{ $count: 'total' }, { $addFields: { page: pageNum } }],
          data: [{ $skip: 20 * pageNum }, { $limit: 20 }],
        },
      },
    ]).toArray((err, result) => {
      if (result) {
        // Format the response by removing MongoDB-specific fields
        const formattedFiles = result[0].data.map((file) => {
          const tmpFile = {
            ...file,
            id: file._id,
          };
          delete tmpFile._id;
          delete tmpFile.localPath; // Do not expose local path
          return tmpFile;
        });
        return response.status(200).json(formattedFiles);
      }
      console.error('Error occurred during file retrieval');
      return response.status(404).json({ error: 'Not found' });
    });
    return null;
  }
}

export default FilesController;

