# Files Manager

# Overview

-Files Manager is a backend project designed to provide a robust system for managing files through a RESTful API. It allows users to perform a variety of file-related operations, such as uploading files, creating folders, retrieving files, managing file permissions, generating image thumbnails, and sending welcome emails for new users. The application is built using Node.js, Express, MongoDB, Redis, and Bull for background processing.

# Features

-User Authentication: The application provides user authentication using basic authentication and token-based sessions. Tokens are generated upon user login and stored in Redis for session management.

# File Management:

Users can upload files or create folders.

Files can be organized hierarchically by specifying parent folders.

File metadata, such as name, type, user ownership, and public accessibility, is stored in MongoDB.

Image files are processed to generate thumbnails of different sizes using a background worker.

Background Processing:

Bull is used as a job queue for handling background tasks.

Image thumbnails (100px, 250px, and 500px) are generated for uploaded images in a separate worker process to avoid slowing down the main API.

A welcome email is sent to new users using background jobs.

File Access Control:

Users can publish or unpublish files to control public access
#API Endpoints

User Management

-POST /users: Create a new user. A welcome email is sent to the new user in the background.

-GET /users/me: Retrieve the authenticated user's details.

# Authentication

-GET /connect: Log in a user and generate an authentication token.

-GET /disconnect: Log out a user and invalidate their authentication token.

# File Management

-POST /files: Upload a new file or create a new folder.

-GET /files/:id: Retrieve metadata for a specific file.

-GET /files: List all files under a specific folder, with pagination support.

-PUT /files/:id/publish: Publish a file to make it publicly accessible.

-PUT /files/:id/unpublish: Unpublish a file to revoke public access.

-GET /files/:id/data: Retrieve the content of a file, with support for fetching different thumbnail sizes (100px, 250px, 500px).
