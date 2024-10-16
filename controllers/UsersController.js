import sha1 from 'sha1';
import dbClient from '../utils/db';

class UsersController {
  /**
   * POST /users
   * Creates a new user in the database.
   */
  static async postNew(req, res) {
    try {
      const { email, password } = req.body;

      // Validate email and password
      if (!email) {
        return res.status(400).json({ error: 'Missing email' });
      }
      if (!password) {
        return res.status(400).json({ error: 'Missing password' });
      }

      // Check if user already exists in the DB
      const userExists = await dbClient.db.collection('users').findOne({ email });
      if (userExists) {
        return res.status(400).json({ error: 'Already exist' });
      }

      // Hash the password with SHA1
      const hashedPassword = sha1(password);

      // Create the new user
      const newUser = {
        email,
        password: hashedPassword,
      };

      // Insert the new user into the database
      const result = await dbClient.db.collection('users').insertOne(newUser);

      // Return the new user's id and email
      return res.status(201).json({ id: result.insertedId, email });
    } catch (error) {
      // Handle any errors that may occur
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export default UsersController;
