# Status Page Backend

A simplified status page application backend built with Node.js, Express, MongoDB, and Socket.io.

## Features

- User authentication (Register/Login with JWT)
- Service management (CRUD operations)
- Incident management (CRUD operations)
- Public status page endpoint
- Real-time updates via WebSocket (Socket.io)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/statuspage
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
NODE_ENV=development
```

3. Make sure MongoDB is running on your system

4. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## API Endpoints

### Auth Routes
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user (returns JWT token)
- `GET /api/auth/me` - Get current user (requires auth)

### Service Routes (Protected - requires JWT token)
- `GET /api/services` - Get all services for authenticated user
- `POST /api/services` - Create a new service
- `PUT /api/services/:id` - Update a service
- `PATCH /api/services/:id/status` - Update service status only
- `DELETE /api/services/:id` - Delete a service

### Incident Routes (Protected - requires JWT token)
- `GET /api/incidents` - Get all incidents for authenticated user
- `POST /api/incidents` - Create a new incident
- `PUT /api/incidents/:id` - Update an incident
- `DELETE /api/incidents/:id` - Delete an incident

### Public Routes (No authentication required)
- `GET /api/public/:userId` - Get public status page data for a user

### Health Check
- `GET /health` - Server health check

## Authentication

Include the JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## WebSocket Events

### Client → Server
- `subscribe` - Subscribe to updates for a specific user
  ```javascript
  socket.emit('subscribe', userId)
  ```

- `unsubscribe` - Unsubscribe from updates
  ```javascript
  socket.emit('unsubscribe', userId)
  ```

### Server → Client
- `service:update` - Emitted when a service status changes
  ```javascript
  {
    serviceId: String,
    status: String,
    timestamp: Date
  }
  ```

- `incident:update` - Emitted when an incident is created or updated
  ```javascript
  {
    incidentId: String,
    status: String,
    message: String,
    title: String,
    serviceId: String,
    timestamp: Date
  }
  ```

## Database Schemas

### User
- email (unique)
- password (hashed)
- name
- createdAt

### Service
- name
- description
- status (operational, degraded, down)
- userId
- createdAt

### Incident
- title
- message
- status (investigating, identified, resolved)
- serviceId
- userId
- createdAt
- resolvedAt

## Example Requests

### Register User
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123",
  "name": "Admin User"
}
```

### Create Service
```bash
POST /api/services
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "API Service",
  "description": "Main API endpoint",
  "status": "operational"
}
```

### Create Incident
```bash
POST /api/incidents
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Service Degradation",
  "message": "We are experiencing high latency",
  "status": "investigating",
  "serviceId": "<service-id>"
}
```

