# Project Management Backend

A comprehensive Node.js backend API for project management with TypeORM and MySQL, featuring authentication, authorization, and CRUD operations for projects and tasks.

## Features

- **Authentication System**

  - User registration and login
  - JWT-based authentication
  - Password reset functionality
  - Role-based access control (Admin/User)

- **User Management**

  - Profile management
  - Role management (admin only)
  - User activation/deactivation

- **Project Management**

  - Create, read, update, delete projects
  - Project member management
  - Project history tracking
  - Filtering, sorting, and pagination

- **Task Management**

  - Create, read, update, delete tasks
  - Task member management
  - Task status tracking
  - Task history tracking

- **File Uploads**
  - Support for uploading project and task images
  - File validation and secure storage

## Tech Stack

- **Backend**: Node.js, Express
- **Database**: MySQL
- **ORM**: TypeORM
- **Authentication**: JWT
- **Validation**: class-validator
- **File Upload**: Multer
- **Email**: Nodemailer
- **Logging**: Winston

## Prerequisites

- Node.js (v14 or above)
- MySQL (v5.7 or above)
- npm or yarn

## Installation

1. Clone the repository

```bash
git clone https://github.com/your-username/project-management-backend.git
cd project-management-backend
```

2. Install dependencies

```bash
npm install
```

3. Configure environment variables

```bash
cp .env.example .env
```

Then edit the `.env` file with your configuration details.

4. Run database migrations

```bash
npm run migration:run
```

5. Seed the database (optional)

```bash
npm run seed
```

6. Start the development server

```bash
npm run dev
```

## API Documentation

### Authentication

- **POST /api/auth/register** - Register a new user
- **POST /api/auth/login** - Login with email and password
- **POST /api/auth/forgot-password** - Request password reset
- **POST /api/auth/reset-password** - Reset password with token
- **GET /api/auth/profile** - Get current user profile
- **POST /api/auth/update-password** - Update password

### Users

- **GET /api/users** - Get all users (Admin only)
- **GET /api/users/:id** - Get user by ID
- **PUT /api/users/:id** - Update user
- **PATCH /api/users/:id/role** - Update user role (Admin only)
- **PATCH /api/users/:id/status** - Toggle user active status (Admin only)
- **DELETE /api/users/:id** - Delete user (Admin only)

### Projects

- **POST /api/projects** - Create a new project
- **GET /api/projects** - Get all accessible projects
- **GET /api/projects/:id** - Get project by ID
- **PUT /api/projects/:id** - Update project
- **PATCH /api/projects/:id/status** - Update project status
- **GET /api/projects/:id/history** - Get project history
- **DELETE /api/projects/:id** - Delete project (Admin only)

### Tasks

- **POST /api/tasks** - Create a new task
- **GET /api/tasks** - Get all accessible tasks
- **GET /api/tasks/:id** - Get task by ID
- **PUT /api/tasks/:id** - Update task
- **PATCH /api/tasks/:id/status** - Update task status
- **GET /api/tasks/:id/history** - Get task history
- **DELETE /api/tasks/:id** - Delete task (Project owner or Admin)

## Project Structure

```
project-management-backend/
├── src/
│   ├── config/             # Configuration files
│   ├── controllers/        # Request handlers
│   ├── database/           # Database related files
│   │   ├── migrations/     # Database migrations
│   │   └── seeds/          # Database seeders
│   ├── dtos/               # Data Transfer Objects
│   ├── entities/           # TypeORM entities
│   ├── middleware/         # Express middleware
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── utils/              # Utility functions
│   └── index.ts            # Application entry point
├── uploads/                # Uploaded files
├── logs/                   # Application logs
├── .env                    # Environment variables
├── .env.example            # Example environment variables
├── package.json            # Project dependencies
├── tsconfig.json           # TypeScript configuration
└── README.md               # Project documentation
```

## Authentication and Authorization

The API uses JWT (JSON Web Tokens) for authentication. To access protected endpoints:

1. Register or login to get a token
2. Add the token to the Authorization header:
   ```
   Authorization: Bearer your-token-here
   ```

## Access Control Rules

- **Admin**: Can perform any operation
- **Project Owner**: Can manage their own projects and tasks
- **Project Member**: Can view projects they are members of and update task status
- **Regular User**: Can only access their own data

## Database Schema

- **users** - User information
- **projects** - Project details
- **tasks** - Task details
- **project_members** - Project membership
- **task_members** - Task assignments
- **project_history** - Project change history
- **task_history** - Task change history

## Testing the API

A Postman collection is included in the repository for testing the API. Import the `postman_collection.json` file into Postman to get started.

## Development

### Running in Development Mode

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

### Running in Production Mode

```bash
npm start
```
