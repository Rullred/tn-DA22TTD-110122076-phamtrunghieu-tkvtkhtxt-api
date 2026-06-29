# API Gateway

Central entry point for all client requests in the Enterprise Student Management System.

## Overview

The API Gateway is responsible for:
- **Routing** - Route requests to appropriate microservices
- **JWT Validation** - Validate JWT tokens before forwarding requests
- **Rate Limiting** - Limit requests per second per IP (100 req/sec)
- **IP Blacklist** - Block requests from blacklisted IPs
- **Load Balancing** - Distribute requests across service instances
- **CORS** - Handle cross-origin requests

## Technology Stack

- **Java**: 21
- **Spring Boot**: 3.5.14
- **Spring Cloud Gateway**: 4.1.5
- **Spring Cloud Netflix Eureka**: 4.1.3
- **Redis**: For rate limiting and IP blacklist
- **JWT**: RS256 for token validation

## Port

- **Application Port**: 8080

## Routes

### IAM Service Routes
- `/api/auth/**` → `iam-service` (No JWT required)
- `/api/users/**` → `iam-service` (JWT required)

### HR Service Routes
- `/api/students/**` → `hr-service` (JWT required)
- `/api/teachers/**` → `hr-service` (JWT required)
- `/api/classes/**` → `hr-service` (JWT required)

## Filters

### Filter Chain Order
1. **IpBlacklistFilter** (Order: -1) - Runs first
2. **RateLimitFilter** - Runs second
3. **JwtAuthenticationFilter** - Runs last (only for protected routes)

### IP Blacklist Filter
- Checks if client IP is in Redis blacklist
- Returns 403 Forbidden if blocked
- Key format: `ip_blacklist:{ip}`

### Rate Limit Filter
- Limits requests to 100 per second per IP
- Uses Redis with 1-second TTL
- Returns 429 Too Many Requests if exceeded
- Key format: `rate_limit:{ip}`

### JWT Authentication Filter
- Validates JWT token from Authorization header
- Extracts user information (userId, username, role)
- Adds headers for downstream services:
  - `X-User-Id`: User ID
  - `X-Username`: Username
  - `X-User-Role`: User role
- Returns 401 Unauthorized if invalid
- Skips validation for excluded paths

## Excluded Paths

The following paths skip JWT validation:
- `/api/auth/login`
- `/api/auth/register`
- `/actuator/**`

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `REDIS_HOST` | Redis host | localhost |
| `REDIS_PORT` | Redis port | 6379 |
| `REDIS_PASSWORD` | Redis password | (empty) |
| `EUREKA_SERVER_URL` | Eureka server URL | http://localhost:8761/eureka/ |
| `JWT_PUBLIC_KEY` | RSA public key for JWT validation | (from file) |
| `RATE_LIMIT_RPS` | Requests per second limit | 100 |

## Running Locally

### Prerequisites
- Java 21
- Maven 3.9+
- Redis running
- Eureka Server running
- IAM Service running (for JWT validation)

### Steps

1. **Start dependencies**:
   ```bash
   docker-compose up -d redis eureka-server iam-service
   ```

2. **Run the gateway**:
   ```bash
   mvn spring-boot:run
   ```

3. **Test**:
   ```bash
   curl http://localhost:8080/actuator/health
   ```

## Running with Docker

```bash
docker build -t api-gateway:latest .
docker run -p 8080:8080 \
  -e REDIS_HOST=redis \
  -e EUREKA_SERVER_URL=http://eureka-server:8761/eureka/ \
  api-gateway:latest
```

## Testing

### Test Rate Limiting
```bash
# Send 150 requests quickly (should get 429 after 100)
for i in {1..150}; do
  curl http://localhost:8080/api/auth/login &
done
```

### Test JWT Validation
```bash
# Without token (should get 401)
curl http://localhost:8080/api/users/me

# With valid token (should work)
curl http://localhost:8080/api/users/me \
  -H "Authorization: Bearer <valid_token>"

# With invalid token (should get 401)
curl http://localhost:8080/api/users/me \
  -H "Authorization: Bearer invalid_token"
```

### Test IP Blacklist
```bash
# Block an IP in Redis
docker exec -it redis redis-cli
SET ip_blacklist:127.0.0.1 "blocked"

# Try to access (should get 403)
curl http://localhost:8080/api/auth/login
```

## Monitoring

### Health Check
```bash
curl http://localhost:8080/actuator/health
```

### Gateway Routes
```bash
curl http://localhost:8080/actuator/gateway/routes
```

### Metrics
```bash
curl http://localhost:8080/actuator/metrics
```

## CORS Configuration

CORS is enabled globally for all origins:
- **Allowed Origins**: `*`
- **Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers**: `*`
- **Max Age**: 3600 seconds

## Load Balancing

The gateway uses Eureka for service discovery and load balancing:
- Uses `lb://` prefix for service URIs
- Automatically discovers service instances
- Distributes requests using round-robin

## Error Responses

All error responses follow this format:
```json
{
  "success": false,
  "message": "Error message",
  "timestamp": "2026-05-29T10:00:00"
}
```

### Common Error Codes
- **401 Unauthorized**: Invalid or missing JWT token
- **403 Forbidden**: IP address is blacklisted
- **429 Too Many Requests**: Rate limit exceeded
- **502 Bad Gateway**: Downstream service unavailable
- **504 Gateway Timeout**: Downstream service timeout

## Security Features

### JWT Validation
- RS256 algorithm with RSA public key
- Token expiration check
- Claims extraction and validation

### Rate Limiting
- Per-IP rate limiting
- Redis-based counter with TTL
- Configurable threshold

### IP Blacklist
- Redis-based blacklist
- Permanent blocking
- Admin can unblock via IAM Service

## Performance

### Throughput
- Designed for high throughput
- Non-blocking reactive architecture
- Redis for fast lookups

### Latency
- Minimal overhead (~5-10ms)
- Async filter execution
- Connection pooling

## Troubleshooting

### Gateway not starting
```bash
# Check logs
docker-compose logs -f api-gateway

# Check dependencies
docker-compose ps
```

### Routes not working
```bash
# Check Eureka registration
curl http://localhost:8761/

# Check gateway routes
curl http://localhost:8080/actuator/gateway/routes
```

### Rate limiting not working
```bash
# Check Redis connection
docker exec -it redis redis-cli
PING

# Check rate limit keys
KEYS rate_limit:*
```

## Development

### Build
```bash
mvn clean package
```

### Run Tests
```bash
mvn test
```

## License

Copyright © 2026 Enterprise Student Management System
