# HR Service

Human Resources Management Service for Enterprise Student Management System.

## Overview

The HR Service manages students, teachers, classes, and enrollments. It provides comprehensive CRUD operations and business logic for the core HR functionality of the system.

## Features

### Student Management
- ✅ Create, read, update, delete students
- ✅ Search students by name
- ✅ Filter students by status (ACTIVE, INACTIVE, GRADUATED, SUSPENDED)
- ✅ Unique student codes (auto-generated)
- ✅ Email validation and uniqueness
- ✅ Avatar support
- ✅ Audit trail (created/updated by/at)

### Teacher Management
- ✅ Create, read, update, delete teachers
- ✅ Search teachers by name
- ✅ Filter teachers by department
- ✅ Filter teachers by status (ACTIVE, ON_LEAVE, RETIRED)
- ✅ Unique teacher codes (auto-generated)
- ✅ Department and specialization tracking
- ✅ Avatar support
- ✅ Audit trail

### Class Management
- ✅ Create, read, update, delete classes
- ✅ Search classes by name
- ✅ Filter classes by teacher
- ✅ Filter classes by status (ACTIVE, COMPLETED, CANCELLED)
- ✅ Unique class codes (auto-generated)
- ✅ Maximum student capacity
- ✅ Current enrollment tracking
- ✅ Schedule and room management
- ✅ Date range validation
- ✅ Audit trail

### Enrollment Management
- ✅ Enroll students in classes
- ✅ Drop students from classes
- ✅ Update enrollment status (ENROLLED, COMPLETED, DROPPED, FAILED)
- ✅ Grade tracking (A, B, C, D, F)
- ✅ Attendance rate tracking
- ✅ Enrollment notes
- ✅ Prevent duplicate enrollments
- ✅ Capacity validation
- ✅ Active student/class validation

## Technology Stack

- **Java**: 21
- **Spring Boot**: 3.5.14
- **Spring Data JPA**: Database access
- **PostgreSQL**: Primary database
- **Flyway**: Database migrations
- **Lombok**: Reduce boilerplate
- **Validation**: Jakarta Bean Validation
- **Docker**: Containerization

## Database Schema

### Students Table
```sql
- id (BIGSERIAL PRIMARY KEY)
- student_code (VARCHAR(20) UNIQUE)
- first_name, last_name (VARCHAR(50))
- email (VARCHAR(100) UNIQUE)
- phone_number (VARCHAR(20))
- date_of_birth (DATE)
- gender (VARCHAR(10))
- address (VARCHAR(200))
- avatar_url (VARCHAR(500))
- status (VARCHAR(20))
- enrollment_date (DATE)
- created_at, updated_at (TIMESTAMP)
- created_by, updated_by (VARCHAR(50))
```

### Teachers Table
```sql
- id (BIGSERIAL PRIMARY KEY)
- teacher_code (VARCHAR(20) UNIQUE)
- first_name, last_name (VARCHAR(50))
- email (VARCHAR(100) UNIQUE)
- phone_number (VARCHAR(20))
- date_of_birth (DATE)
- gender (VARCHAR(10))
- address (VARCHAR(200))
- avatar_url (VARCHAR(500))
- department (VARCHAR(100))
- specialization (VARCHAR(100))
- status (VARCHAR(20))
- hire_date (DATE)
- created_at, updated_at (TIMESTAMP)
- created_by, updated_by (VARCHAR(50))
```

### Classes Table
```sql
- id (BIGSERIAL PRIMARY KEY)
- class_code (VARCHAR(20) UNIQUE)
- class_name (VARCHAR(100))
- description (VARCHAR(500))
- teacher_id (BIGINT FK)
- subject (VARCHAR(100))
- room (VARCHAR(50))
- max_students (INTEGER)
- current_students (INTEGER)
- schedule (VARCHAR(200))
- status (VARCHAR(20))
- start_date, end_date (DATE)
- created_at, updated_at (TIMESTAMP)
- created_by, updated_by (VARCHAR(50))
```

### Class Enrollments Table
```sql
- id (BIGSERIAL PRIMARY KEY)
- class_id (BIGINT FK)
- student_id (BIGINT FK)
- enrollment_date (TIMESTAMP)
- status (VARCHAR(20))
- grade (VARCHAR(10))
- attendance_rate (DOUBLE PRECISION)
- notes (VARCHAR(500))
- dropped_at (TIMESTAMP)
- UNIQUE(class_id, student_id)
```

## API Endpoints

### Student Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | Get all students (paginated) |
| GET | `/api/students/{id}` | Get student by ID |
| GET | `/api/students/code/{code}` | Get student by code |
| GET | `/api/students/search?name=xxx` | Search students by name |
| GET | `/api/students/status/{status}` | Get students by status |
| POST | `/api/students` | Create new student |
| PUT | `/api/students/{id}` | Update student |
| DELETE | `/api/students/{id}` | Delete student |
| GET | `/api/students/count` | Get total student count |
| GET | `/api/students/count/status/{status}` | Count students by status |

### Teacher Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/teachers` | Get all teachers (paginated) |
| GET | `/api/teachers/{id}` | Get teacher by ID |
| GET | `/api/teachers/code/{code}` | Get teacher by code |
| GET | `/api/teachers/search?name=xxx` | Search teachers by name |
| GET | `/api/teachers/department/{dept}` | Get teachers by department |
| GET | `/api/teachers/status/{status}` | Get teachers by status |
| POST | `/api/teachers` | Create new teacher |
| PUT | `/api/teachers/{id}` | Update teacher |
| DELETE | `/api/teachers/{id}` | Delete teacher |
| GET | `/api/teachers/count` | Get total teacher count |
| GET | `/api/teachers/count/status/{status}` | Count teachers by status |
| GET | `/api/teachers/count/department/{dept}` | Count teachers by department |

### Class Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/classes` | Get all classes (paginated) |
| GET | `/api/classes/{id}` | Get class by ID |
| GET | `/api/classes/code/{code}` | Get class by code |
| GET | `/api/classes/search?name=xxx` | Search classes by name |
| GET | `/api/classes/teacher/{teacherId}` | Get classes by teacher |
| GET | `/api/classes/status/{status}` | Get classes by status |
| POST | `/api/classes` | Create new class |
| PUT | `/api/classes/{id}` | Update class |
| DELETE | `/api/classes/{id}` | Delete class |
| GET | `/api/classes/count` | Get total class count |
| GET | `/api/classes/count/status/{status}` | Count classes by status |

### Enrollment Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/classes/{classId}/enroll` | Enroll student in class |
| DELETE | `/api/classes/{classId}/students/{studentId}` | Drop student from class |
| GET | `/api/classes/{classId}/enrollments` | Get class enrollments |
| GET | `/api/classes/{classId}/students` | Get active students in class |
| PUT | `/api/classes/enrollments/{enrollmentId}` | Update enrollment |
| GET | `/api/classes/students/{studentId}/enrollments` | Get student enrollments |

## Request/Response Examples

### Create Student
```bash
POST /api/students
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "+1234567890",
  "dateOfBirth": "2000-01-15",
  "gender": "MALE",
  "address": "123 Main St, City",
  "enrollmentDate": "2024-09-01"
}
```

### Create Teacher
```bash
POST /api/teachers
Content-Type: application/json

{
  "firstName": "Jane",
  "lastName": "Smith",
  "email": "jane.smith@example.com",
  "phoneNumber": "+1234567891",
  "dateOfBirth": "1985-05-20",
  "gender": "FEMALE",
  "address": "456 Oak Ave, City",
  "department": "Computer Science",
  "specialization": "Software Engineering",
  "hireDate": "2020-08-15"
}
```

### Create Class
```bash
POST /api/classes
Content-Type: application/json

{
  "className": "Introduction to Programming",
  "description": "Learn the basics of programming",
  "teacherId": 1,
  "subject": "Computer Science",
  "room": "CS-101",
  "maxStudents": 30,
  "schedule": "Mon/Wed/Fri 10:00-11:30",
  "startDate": "2024-09-01",
  "endDate": "2024-12-15"
}
```

### Enroll Student
```bash
POST /api/classes/1/enroll
Content-Type: application/json

{
  "studentId": 1,
  "notes": "Regular enrollment"
}
```

### Update Enrollment
```bash
PUT /api/classes/enrollments/1
Content-Type: application/json

{
  "status": "COMPLETED",
  "grade": "A",
  "attendanceRate": 95.5,
  "notes": "Excellent performance"
}
```

## Configuration

### Application Properties
```yaml
spring:
  application:
    name: hr-service
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5433}/${DB_NAME:hr_db}
    username: ${DB_USERNAME:hr_user}
    password: ${DB_PASSWORD:hr_password}
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
  flyway:
    enabled: true
    baseline-on-migrate: true

server:
  port: 8082

eureka:
  client:
    service-url:
      defaultZone: ${EUREKA_SERVER_URL:http://localhost:8761/eureka/}
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| DB_HOST | localhost | PostgreSQL host |
| DB_PORT | 5433 | PostgreSQL port |
| DB_NAME | hr_db | Database name |
| DB_USERNAME | hr_user | Database username |
| DB_PASSWORD | hr_password | Database password |
| EUREKA_SERVER_URL | http://localhost:8761/eureka/ | Eureka server URL |

## Running the Service

### Local Development
```bash
# Run with Maven
mvn spring-boot:run

# Or build and run JAR
mvn clean package
java -jar target/hr-service-1.0.0.jar
```

### Docker
```bash
# Build image
docker build -t hr-service:latest .

# Run container
docker run -p 8082:8082 \
  -e DB_HOST=postgres \
  -e DB_PORT=5433 \
  -e EUREKA_SERVER_URL=http://eureka-server:8761/eureka/ \
  hr-service:latest
```

### Docker Compose
```bash
# Start all services
cd backend
docker-compose up -d hr-service
```

## Database Migrations

Flyway migrations are located in `src/main/resources/db/migration/`:

- `V1__create_students_table.sql` - Students table
- `V2__create_teachers_table.sql` - Teachers table
- `V3__create_classes_table.sql` - Classes table
- `V4__create_class_enrollments_table.sql` - Enrollments table

Migrations run automatically on application startup.

## Business Rules

### Student Management
- Email must be unique
- Student code is auto-generated (format: STU + 8 random chars)
- Default status is ACTIVE

### Teacher Management
- Email must be unique
- Teacher code is auto-generated (format: TCH + 8 random chars)
- Default status is ACTIVE
- Only ACTIVE teachers can be assigned to classes

### Class Management
- Class code is auto-generated (format: CLS + 8 random chars)
- End date must be after start date
- Cannot reduce max students below current enrollment
- Cannot delete class with active enrollments
- Default status is ACTIVE

### Enrollment Management
- Student can only enroll once per class
- Class must be ACTIVE
- Student must be ACTIVE
- Class must not be full
- Dropping a student decrements current enrollment count
- Status changes: ENROLLED → COMPLETED/DROPPED/FAILED

## Error Handling

All errors return a standard response:
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "timestamp": "2024-05-29T10:30:00"
}
```

Common error codes:
- `RESOURCE_NOT_FOUND` - Entity not found
- `BAD_REQUEST` - Invalid request data
- `VALIDATION_ERROR` - Validation failed
- `INTERNAL_SERVER_ERROR` - Unexpected error

## Testing

### Manual Testing with cURL

```bash
# Create student
curl -X POST http://localhost:8082/api/students \
  -H "Content-Type: application/json" \
  -d '{"firstName":"John","lastName":"Doe","email":"john@example.com","dateOfBirth":"2000-01-15","gender":"MALE","enrollmentDate":"2024-09-01"}'

# Get all students
curl http://localhost:8082/api/students

# Search students
curl "http://localhost:8082/api/students/search?name=John"

# Create teacher
curl -X POST http://localhost:8082/api/teachers \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Jane","lastName":"Smith","email":"jane@example.com","dateOfBirth":"1985-05-20","gender":"FEMALE","department":"CS","hireDate":"2020-08-15"}'

# Create class
curl -X POST http://localhost:8082/api/classes \
  -H "Content-Type: application/json" \
  -d '{"className":"Intro to Programming","teacherId":1,"subject":"CS","maxStudents":30,"startDate":"2024-09-01","endDate":"2024-12-15"}'

# Enroll student
curl -X POST http://localhost:8082/api/classes/1/enroll \
  -H "Content-Type: application/json" \
  -d '{"studentId":1}'
```

## Health Check

```bash
curl http://localhost:8082/actuator/health
```

## Service Discovery

The service registers with Eureka Server on startup:
- Service Name: `hr-service`
- Instance ID: `hr-service:8082`
- Health Check URL: `/actuator/health`

## Future Enhancements

- [ ] File upload for avatars
- [ ] Bulk operations (import/export)
- [ ] Advanced search with filters
- [ ] Attendance tracking
- [ ] Grade calculation
- [ ] Report generation
- [ ] Email notifications
- [ ] Integration with IAM service for authorization
- [ ] Caching with Redis
- [ ] Event publishing for audit trail

## License

Copyright © 2026 Enterprise Student Management System
