import { Router } from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthController from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const router = Router();

/** Application Status Routes **/
// Route to check if the server is running
router.get('/status', AppController.getStatus);

// Route to get general statistics like number of users and files
router.get('/stats', AppController.getStats);

/** User Management Routes **/
// Route to create a new user
router.post('/users', UsersController.postNew);

// Route to get information about the logged-in user
router.get('/users/me', UsersController.getMe);

/** Authentication Routes **/
// Route for user login, generates an authentication token
router.get('/connect', AuthController.getConnect);

// Route for user logout, invalidates the authentication token
router.get('/disconnect', AuthController.getDisconnect);

/** File Management Routes **/
// Route to create a new file or folder
router.post('/files', FilesController.postUpload);

// Route to get file metadata by ID
router.get('/files/:id', FilesController.getShow);

// Route to list all files for a given parent folder with pagination
router.get('/files', FilesController.getIndex);

// Route to publish a file (make it publicly accessible)
router.put('/files/:id/publish', FilesController.putPublish);

// Route to unpublish a file (remove public access)
router.put('/files/:id/unpublish', FilesController.putUnpublish);

// Route to get the actual content of a file by ID
router.get('/files/:id/data', FilesController.getFile);

export default router;
