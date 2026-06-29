# IAM Service

Identity and Access Management Service for Enterprise Student Management System.

## Overview

The IAM Service is responsible for:
- User authentication (login, logout)
- JWT token generation and validation (RS256)
- Refresh token management
- Account locking mechanism (brute-force protection)
- IP blacklist management
- Password encryption (BCrypt)
- Sensitive data encryption (AES-GCM)
- Security event logging

## Technology Stack

- **Java**: 21
- **Spring Boot**: 3.5.14
- **Spring Cloud**: 2024.0.0
- **Database**: PostgreSQL
- **Cache**: Redis
- **Service Discovery**: Eureka Client

## Port

- **Application Port**: 8081

## Package Structure

```
com.enterprise.studentmanagement.iam
├── controller/       # REST API controllers
├── service/          # Business logic layer
├── repository/       # Data access layer (JPA)
├── dto/              # Data Transfer Objects
├── entity/           # JPA entities
├── config/           # Spring configuration
├── security/         # Security components (JWT, encryption)
├── exception/        # Custom exceptions and handlers
└── util/             # Utility classes
```

## Database Schema

### Tables
- `users` - User accounts with credentials and roles
- `refresh_tokens` - Refresh token storage
- `security_logs` - Security event audit logs

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_NAME` | Database name | iam_db |
| `DB_USERNAME` | Database username | postgres |
| `DB_PASSWORD` | Database password | postgres |
| `EUREKA_SERVER_URL` | Eureka server URL | http://localhost:8761/eureka/ |
| `JWT_PUBLIC_KEY` | RSA public key (Base64 or PEM) | (generated at runtime) |
| `JWT_PRIVATE_KEY` | RSA private key (Base64 or PEM) | (generated at runtime) |
| `JWT_EXPIRATION` | Access token TTL (Duration) | 3600s |
| `REFRESH_TOKEN_EXPIRATION` | Refresh token TTL (Duration) | 604800s |
| `PASSWORD_MIN_LENGTH` | Minimum password length | 8 |
| `BCRYPT_STRENGTH` | BCrypt strength | 12 |
| `LOCK_THRESHOLD_1` | Failed attempts before short lock | 5 |
| `LOCK_DURATION_1` | Short lock duration | 15m |
| `LOCK_THRESHOLD_2` | Failed attempts before long lock | 10 |
| `LOCK_DURATION_2` | Long lock duration | 30m |
| `IP_BLOCK_THRESHOLD` | Failed attempts per IP before block | 15 |

## Running Locally

### Prerequisites
- Java 21
- Maven 3.9+
- PostgreSQL 16
- Redis 7.2

### Steps

1. Start PostgreSQL and Redis
2. Create database:
   ```sql
   CREATE DATABASE iam_db;
   ```
3. Run the application:
   ```bash
   mvn spring-boot:run
   ```

## Running with Docker

```bash
docker build -t iam-service:latest .
docker run -p 8081:8081 \
  -e DB_HOST=postgres \
  -e DB_PORT=5432 \
  -e DB_NAME=iam_db \
  -e DB_USERNAME=postgres \
  -e DB_PASSWORD=postgres \
  -e EUREKA_SERVER_URL=http://eureka-server:8761/eureka/ \
  iam-service:latest
```

## Health Check

```bash
curl http://localhost:8081/actuator/health
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get tokens
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout and revoke tokens

### User Management
- `GET /api/users/me` - Get current user info
- `PUT /api/users/me/password` - Change password
- `POST /api/users/{id}/unlock` - Unlock account (ADMIN only)
- `DELETE /api/users/ip-blacklist/{ip}` - Remove IP from blacklist (ADMIN only)

## Security Features

### JWT (RS256)
- Access token expiry: 1 hour
- Refresh token expiry: 7 days
- RSA 2048-bit key pair

### Account Locking
- 5 failed attempts → 15 minutes lock
- 10 failed attempts → 30 minutes lock

### IP Blacklist
- 15 failed attempts from same IP → permanent block
- Admin can unblock

### Password Security
- BCrypt hashing with 12 rounds
- Minimum password requirements enforced

## Development

### Build
```bash
mvn clean package
```

### Run Tests
```bash
mvn test
```

### Code Coverage
```bash
mvn verify
```

## License

Copyright © 2026 Enterprise Student Management System
