# Campaign Manager API

A Node.js/Express API for managing marketing campaigns with scheduled activation times.

## Features

- RESTful API for campaign management
- Background processing with Redis-backed queues
- Scheduled activation of campaigns using cron jobs
- Support for different campaign types (Cost per Order, Cost per Click, Buy One Get One)
- Automatic calculation of next activation times

## Tech Stack

- Node.js & TypeScript
- Express.js
- MongoDB with Mongoose
- Bull queue for background processing
- Redis for queue storage
- Docker for containerization

## Authentication

The API uses Firebase Authentication:

- All endpoints are protected with Firebase Auth middleware
- Include a valid Firebase ID token in the Authorization header
- Token is verified using Firebase Admin SDK

## API Endpoints

- `GET /campaigns` - List all campaigns with filtering
- `POST /campaigns` - Create a new campaign
- `PUT /campaigns/:id` - Update an existing campaign
- `DELETE /campaigns/:id` - Delete a campaign

## Configuration

1. Environment Variables:

   - Create a `.env` file with your `MONGODB_CONNECTION_STRING`
   - Set Redis password and other configuration options

2. Firebase Setup:
   - Place your Firebase `serviceAccountKey.json` in `config/credentials/`
   - Required for authentication middleware

## Usage

### Development

```bash
# Install dependencies
npm install

# Run in development mode (Unix/Linux/Mac)
npm run dev

# Run in development mode (Windows)
npm run dev:win

# Watch for TypeScript changes
npm run watch
```

### Production

```bash
# Build the application
npm run build

# Run in production mode
npm run prod
# or
npm run start
```

## Deployment

The application can be deployed as a Docker container to any vps after setting up the backend server.
