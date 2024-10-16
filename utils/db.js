import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();  // Load environment variables

class DBClient {
  constructor() {
    // Define the MongoDB connection parameters
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';

    const url = `mongodb://${host}:${port}`;

    // Create a new MongoDB client and connect
    this.client = new MongoClient(url, { useUnifiedTopology: true });
    this.client.connect()
      .then(() => {
        this.db = this.client.db(database);
        console.log('MongoDB connected successfully');
      })
      .catch((err) => console.error('Failed to connect to MongoDB', err));
  }

  /**
   * Check if the connection to MongoDB is alive
   * @returns {boolean} true if the connection is alive, false otherwise
   */
  isAlive() {
    return this.client.isConnected();
  }

  /**
   * Get the number of users in the 'users' collection
   * @returns {Promise<number>} - The number of users in the collection
   */
  async nbUsers() {
    return this.db.collection('users').countDocuments();
  }

  /**
   * Get the number of files in the 'files' collection
   * @returns {Promise<number>} - The number of files in the collection
   */
  async nbFiles() {
    return this.db.collection('files').countDocuments();
  }
}

// Create and export an instance of DBClient
const dbClient = new DBClient();
export default dbClient;
