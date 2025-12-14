# HealthMaster Application (Backend)

This repository contains the entire **backend** for the **HealthMaster** project.

## Technologies Used

- **TypeScript** — main programming language
- **PostgreSQL** — chosen relational database
- **Bun** — runtime environment

## Main Dependencies

- **bcrypt** — for password hashing
- **jsonwebtoken (JWT)** — for user authentication
- **prisma** — ORM for database interactions
- **elysia** — web framework for Bun
- **slugify** — for generating clean slugs from post titles

## Folder Structure

- All environment configuration files are in the **root directory**
- The main codebase is inside the **`src/`** folder
- Inside `src/`, you’ll find four folders:
  - **Routes Folder**
  - **Prisma Folder**
  - **Utilities Folder**
  - **Plugins Folder**

### Routes Folder

Contains all the route definitions for the application, organized by entity. Each entity (like users, doctors, consultations, etc.) has its own folder inside the routes folder

Inside each routes folder, you’ll typically find **six** types of files:

- **schemas** — define the validation schemas for requests and responses
- **types** — define TypeScript types and interfaces
- **models** — interact with the database
- **services** — contain the business logic
- **controllers** — handle incoming requests and send responses
- **tests** - contain the tests for each module (right now only models have tests)

The cycle goes like this: controllers call services, services call models, and models interact with the database.

### Prisma Folder

This folder contains the Prisma schema file and any related configurations for the ORM.

### Plugins Folder

This folder is used to store custom plugins that extend the functionality of the Elysia framework.
For example, you might have authentication plugins, logging plugins, or any other middleware-like functionality that you want to apply across your application.

### Utilities Folder

This folder is used for containing utilites files in general, such classes or funcions that you can reuse.
As this folder continues to grow, you might want to detach some files and organize them inside a new folder

## How to Run Locally

### 1.Clone the repository

```
git clone https://github.com/Samuel-lab-prog/healthMasterBackend.git
cd healthMasterBackend
```

### 2.Install dependencies

```
bun install
```

### 3.Configure envoirment variables

```
TEST_DATABASE_URL=yourTestDbConnectionString
SALT_ROUNDS=10
JWT_SECRET=yourSecretKey
And so on...
```

### 4.Run the local development server

```
npm run dev
```

## Good practices and code style

This project follows several standards and patterns to ensure clean, maintainable, and scalable code — making it easier for anyone to contribute and understand.

### Commits patterns

1.  Use a prefix for every commit. Commomn prefixes include:

- feat: → for new features
- fix: → for bug fixes
- refactor: → for code restructuring without changing functionality
- docs: → for documentation changes
- style: → for formatting or code style adjustments
- test: → for adding or updating tests

2.  Keep commits focused: Each commit should address only one clear purpose.
    Avoid large, mixed commits — instead, split them into smaller, well-defined ones.
3.  Write meaningful commit messages:
    **Bad:** fix stuff
    **Good:** fix: resolve user authentication token validation issue

### API Documentation

The API is documented using OpenAPI (Swagger) standards. Each route includes detailed information about request parameters, responses, and error handling.
