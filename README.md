# NestJS MongoDB Starter

Enterprise-grade NestJS starter project with MongoDB, JWT authentication (access + refresh tokens), Swagger documentation, and Task Management example domain.

## Features

- **JWT Authentication** - Complete authentication system with access and refresh tokens
- **MongoDB Integration** - Mongoose ODM with proper indexing and schema validation
- **Swagger/OpenAPI** - Comprehensive API documentation with interactive UI
- **Task Management** - Example CRUD operations demonstrating best practices
- **Docker Support** - Docker Compose setup for local MongoDB + Mongo Express
- **Security Best Practices** - Helmet, CORS, bcrypt password hashing, input validation
- **Repository Pattern** - Clean architecture with separation of concerns
- **Global Error Handling** - Consistent error responses across the application
- **Response Transformation** - Standardized API responses
- **Role-Based Access Control** - User roles and permissions system
- **Environment Configuration** - Type-safe configuration with validation

## Tech Stack

- **NestJS** 11.x - Progressive Node.js framework
- **MongoDB** 7.x - NoSQL database
- **Mongoose** 9.x - MongoDB ODM
- **JWT** - JSON Web Tokens for authentication
- **Passport** - Authentication middleware
- **Swagger** - API documentation
- **Docker** - Containerization
- **TypeScript** - Type safety
- **Class Validator** - DTO validation
- **Helmet** - Security headers
- **bcrypt** - Password hashing

## Prerequisites

- Node.js 20+
- pnpm (or npm/yarn)
- Docker and Docker Compose (for local MongoDB)

## Getting Started

### 1. Installation

```bash
pnpm install
```

### 2. Environment Setup

Copy the example environment file:

```bash
cp .env.example .env
```

Generate secure JWT secrets:

```bash
node -e "console.log('JWT_ACCESS_SECRET=' + require('crypto').randomBytes(32).toString('hex')); console.log('JWT_REFRESH_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

Update your `.env` file with the generated secrets.

### 3. Start MongoDB

```bash
pnpm run docker:dev
```

This will start:
- MongoDB on `localhost:27017`
- Mongo Express on `localhost:8081` (admin/admin123)

### 4. Run the Application

Development mode:
```bash
pnpm run start:dev
```

Production build:
```bash
pnpm run build
pnpm run start:prod
```

### 5. Access the API

- **API**: `http://localhost:3000/api`
- **Swagger Documentation**: `http://localhost:3000/api/docs`
- **Health Check**: `http://localhost:3000/api/health`

## Environment Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment | `development` | No |
| `PORT` | Application port | `3000` | No |
| `API_PREFIX` | API prefix | `api` | No |
| `MONGODB_URI` | MongoDB connection string | `mongodb://admin:password123@localhost:27017/nestjs-starter?authSource=admin` | Yes |
| `JWT_ACCESS_SECRET` | Access token secret (32+ chars) | Generated value | Yes |
| `JWT_REFRESH_SECRET` | Refresh token secret (32+ chars) | Generated value | Yes |
| `JWT_ACCESS_EXPIRES_IN` | Access token expiration | `15m` | No |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token expiration | `7d` | No |
| `BCRYPT_SALT_ROUNDS` | Password hashing rounds | `10` | No |
| `SWAGGER_ENABLED` | Enable Swagger UI | `true` | No |
| `CORS_ENABLED` | Enable CORS | `true` | No |
| `CORS_ORIGIN` | CORS allowed origins | `*` | No |

## Project Structure

The project follows a feature-based modular architecture:

- **config/** - Environment configuration with validation
- **common/** - Shared utilities (decorators, guards, filters, interceptors, DTOs)
- **auth/** - Authentication module (register, login, refresh, logout)
- **users/** - User management module
- **tasks/** - Task management module (example domain)

Each module contains:
- **schemas/** - Mongoose schemas
- **dto/** - Data Transfer Objects with validation
- **repository.ts** - Data access layer
- **service.ts** - Business logic
- **controller.ts** - HTTP endpoints
- **module.ts** - Module configuration

## Architecture Patterns

### Repository Pattern

Separates data access from business logic:

src/users/users.repository.ts:1
- Data access operations
- MongoDB query execution
- Database-specific logic

src/users/users.service.ts:1
- Business logic
- DTO transformation
- Error handling

### DTO Validation

All inputs are validated using class-validator:

```typescript
@IsEmail()
@IsNotEmpty()
email: string;

@MinLength(8)
@Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
password: string;
```

### Response Transformation

Standardized responses using global interceptor:

```json
{
  "success": true,
  "data": { ... },
  "timestamp": "2025-12-30T...",
  "path": "/api/endpoint"
}
```

## Security Features

### Password Security
- bcrypt hashing with 10 salt rounds
- Password complexity requirements
- Passwords excluded from queries (`select: false`)

### JWT Authentication
- **Access Tokens**: 15-minute expiration
- **Refresh Tokens**: 7-day expiration
- **Token Rotation**: Refresh tokens rotated on use
- **Database Storage**: Tokens stored for revocation
- **Metadata Tracking**: IP address and user agent logged

### HTTP Security
- Helmet for security headers
- CORS configuration
- Input validation on all endpoints
- MongoDB injection protection

## Database Schema

### User Model
- email (unique, indexed)
- firstName, lastName
- password (hashed, select: false)
- roles (array, default: [USER])
- isActive, lastLoginAt, emailVerifiedAt
- createdAt, updatedAt (timestamps)

### RefreshToken Model
- userId (ref: User)
- token (unique, indexed)
- expiresAt (with TTL index)
- isRevoked, revokedAt
- userAgent, ipAddress

### Task Model
- title, description
- status (TODO, IN_PROGRESS, COMPLETED, ARCHIVED)
- priority (LOW, MEDIUM, HIGH, URGENT)
- userId (ref: User)
- dueDate, tags, completedAt
- createdAt, updatedAt

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/refresh` | Refresh access token |
| POST | `/api/auth/logout` | Logout user |

### Users

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/users/me` | Get current user | Protected |
| GET | `/api/users` | List users | Admin |
| GET | `/api/users/:id` | Get user by ID | Admin |
| PUT | `/api/users/:id` | Update user | Protected |
| DELETE | `/api/users/:id` | Delete user | Admin |

### Tasks

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/tasks` | Create task | Protected |
| GET | `/api/tasks` | List tasks (with filters) | Protected |
| GET | `/api/tasks/:id` | Get task | Protected |
| PUT | `/api/tasks/:id` | Update task | Protected |
| DELETE | `/api/tasks/:id` | Delete task | Protected |

### Example Usage

**Register a new user:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john.doe@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "password": "SecurePass123!"
  }'
```

**Create a task:**

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "Complete project documentation",
    "description": "Write comprehensive API docs",
    "priority": "HIGH",
    "tags": ["documentation"]
  }'
```

## Testing

```bash
pnpm test          # Unit tests
pnpm test:e2e      # E2E tests
pnpm test:cov      # Coverage report
```

## Docker Commands

```bash
pnpm run docker:dev    # Start MongoDB + Mongo Express
pnpm run docker:down   # Stop services
pnpm run docker:logs   # View MongoDB logs
```

Access Mongo Express at `http://localhost:8081`:
- Username: `admin`
- Password: `admin123`

## Best Practices Implemented

- Feature-based module structure
- Repository pattern for data access
- DTO validation for all inputs
- Service layer for business logic
- Guards for authentication/authorization
- Interceptors for response transformation
- Filters for error handling
- Environment-based configuration with validation
- Database indexing for performance
- Password hashing with bcrypt
- JWT with token rotation
- Swagger documentation
- Health check endpoint
- Docker support
- TypeScript strict mode

## License

UNLICENSED
