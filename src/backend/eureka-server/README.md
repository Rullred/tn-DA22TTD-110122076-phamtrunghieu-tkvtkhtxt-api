# Eureka Server

Service Discovery Server for Enterprise Student Management System.

## Overview

This Eureka Server allows microservices to register themselves and discover other services without hardcoding IP addresses or ports.

## Technology Stack

- **Java**: 21
- **Spring Boot**: 3.5.14
- **Spring Cloud**: 2024.0.0
- **Spring Cloud Netflix Eureka Server**: 4.1.3

## Configuration

- **Port**: 8761
- **Self-preservation**: Disabled (for development)
- **Eviction Interval**: 30 seconds

## Running Locally

### Prerequisites

- Java 21
- Maven 3.9+

### Steps

1. Build the project:
   ```bash
   mvn clean package
   ```

2. Run the application:
   ```bash
   java -jar target/eureka-server-1.0.0.jar
   ```

3. Access Eureka Dashboard:
   ```
   http://localhost:8761
   ```

## Running with Docker

### Build Docker Image

```bash
docker build -t eureka-server:latest .
```

### Run Docker Container

```bash
docker run -d -p 8761:8761 --name eureka-server eureka-server:latest
```

### Access Eureka Dashboard

```
http://localhost:8761
```

## Health Check

The Eureka Server exposes health check endpoint:

```
http://localhost:8761/actuator/health
```

## Configuration Details

### Eureka Server Settings

- **register-with-eureka**: false (server doesn't register with itself)
- **fetch-registry**: false (server doesn't fetch registry)
- **enable-self-preservation**: false (disabled for development)
- **eviction-interval-timer-in-ms**: 30000 (30 seconds)

### Actuator Endpoints

- Health: `/actuator/health`
- Info: `/actuator/info`

## Service Registration

Other microservices can register with this Eureka Server by adding the following configuration:

```yaml
eureka:
  client:
    service-url:
      defaultZone: http://localhost:8761/eureka/
    register-with-eureka: true
    fetch-registry: true
```

## Troubleshooting

### Services not appearing in Eureka Dashboard

1. Check if the service has `@EnableDiscoveryClient` annotation
2. Verify the service's `eureka.client.service-url.defaultZone` points to this server
3. Check network connectivity between services
4. Review service logs for registration errors

### Eureka Server not starting

1. Verify port 8761 is not already in use
2. Check Java version (must be 21)
3. Review application logs for errors

## Docker Compose Integration

This service is designed to work with Docker Compose. See the main `docker-compose.yml` in the backend directory for full system deployment.
