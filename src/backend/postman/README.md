# Postman Collection - Enterprise Student Management System

## Overview

This directory contains the Postman collection for testing the Enterprise Student Management System API.

## Files

- `Enterprise-Student-Management.postman_collection.json` - Complete API collection

## Setup

### 1. Import Collection

1. Open Postman
2. Click "Import" button
3. Select `Enterprise-Student-Management.postman_collection.json`
4. Collection will be imported with all requests

### 2. Configure Variables

The collection uses the following variables:

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `base_url` | http://localhost:8080 | API Gateway URL |
| `access_token` | (auto-set) | JWT access token |
| `refresh_token` | (auto-set) | JWT refresh token |

**Note**: Tokens are automatically set after successful login/register.

### 3. Environment Setup (Optional)

You can create different environments for different deployments:

**Local Environment**:
```json
{
  "base_url": "http://localhost:8080"
}
```

**Development Environment**:
```json
{
  "base_url": "https://dev-api.example.com"
}
```

**Production Environment**:
```json
{
  "base_url": "https://api.example.com"
}
```

## Usage

### Authentication Flow

1. **Register** (optional):
   - Run "Register User" request
   - Tokens will be automatically saved

2. **Login**:
   - Run "Login" request with credentials
   - Tokens will be automatically saved
   - Default admin credentials:
     - Username: `admin`
     - Password: `Admin@123`

3. **Use Protected Endpoints**:
   - All subsequent requests will use the saved access token
   - Token is automatically included in Authorization header

4. **Refresh Token** (when access token expires):
   - Run "Refresh Token" request
   - New access token will be automatically saved

5. **Logout**:
   - Run "Logout" request to revoke tokens

### Testing Workflow

#### Complete Student Management Flow

1. **Login** as admin
2. **Create Student**:
   ```json
   {
     "firstName": "John",
     "lastName": "Doe",
     "email": "john.doe@example.com",
     "phoneNumber": "+1234567890",
     "dateOfBirth": "2000-01-15",
     "gender": "MALE",
     "address": "123 Main St",
     "enrollmentDate": "2024-09-01"
   }
   ```
3. **Get All Students** - Verify student was created
4. **Get Student by ID** - Get specific student details
5. **Search Students** - Search by name
6. **Upload Avatar** - Upload student photo
7. **Update Student** - Modify student information
8. **Delete Student** - Remove student (optional)

#### Complete Class Enrollment Flow

1. **Create Teacher**
2. **Create Class** with teacher ID
3. **Create Student**
4. **Enroll Student** in class
5. **Get Class Enrollments** - Verify enrollment
6. **Update Enrollment** - Add grade and attendance
7. **Drop Student** - Remove from class (optional)

## Request Organization

### IAM Service
- **Authentication**
  - Register User
  - Login
  - Refresh Token
  - Logout
- **User Management**
  - Get Current User
  - Change Password

### HR Service
- **Students** (10 requests)
  - CRUD operations
  - Search and filters
  - Avatar upload
  - Statistics
- **Teachers** (11 requests)
  - CRUD operations
  - Search and filters
  - Avatar upload
  - Statistics
- **Classes** (14 requests)
  - CRUD operations
  - Enrollment management
  - Search and filters
  - Statistics

## Test Scripts

The collection includes automatic test scripts:

### Login/Register Requests
```javascript
if (pm.response.code === 200) {
    const response = pm.response.json();
    pm.collectionVariables.set('access_token', response.data.accessToken);
    pm.collectionVariables.set('refresh_token', response.data.refreshToken);
}
```

This automatically saves tokens for subsequent requests.

## Common Request Examples

### Create Student
```bash
POST {{base_url}}/api/students
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phoneNumber": "+1234567890",
  "dateOfBirth": "2000-01-15",
  "gender": "MALE",
  "address": "123 Main St",
  "enrollmentDate": "2024-09-01"
}
```

### Upload Avatar
```bash
POST {{base_url}}/api/upload/students/1/avatar
Authorization: Bearer {{access_token}}
Content-Type: multipart/form-data

file: [binary file]
```

### Search Students
```bash
GET {{base_url}}/api/students/search?name=John&page=0&size=20
Authorization: Bearer {{access_token}}
```

### Enroll Student in Class
```bash
POST {{base_url}}/api/classes/1/enroll
Authorization: Bearer {{access_token}}
Content-Type: application/json

{
  "studentId": 1,
  "notes": "Regular enrollment"
}
```

## Response Format

All responses follow this format:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... },
  "timestamp": "2026-05-29T10:30:00"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "error": "ERROR_CODE",
  "timestamp": "2026-05-29T10:30:00"
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Data retrieved successfully",
  "data": {
    "content": [ ... ],
    "pageNumber": 0,
    "pageSize": 20,
    "totalElements": 100,
    "totalPages": 5,
    "first": true,
    "last": false,
    "empty": false
  },
  "timestamp": "2026-05-29T10:30:00"
}
```

## Troubleshooting

### 401 Unauthorized
- Token expired: Run "Refresh Token" request
- No token: Run "Login" request first
- Invalid token: Login again

### 403 Forbidden
- Insufficient permissions
- Login with appropriate role (ADMIN, TEACHER, STUDENT)

### 400 Bad Request
- Check request body format
- Verify required fields
- Check data types and validation rules

### 404 Not Found
- Verify resource ID exists
- Check endpoint URL

### 429 Too Many Requests
- Rate limit exceeded (100 req/sec per IP)
- Wait a moment and retry

## Tips

1. **Use Collection Runner**:
   - Run entire collection or folder
   - Automated testing
   - Generate reports

2. **Use Pre-request Scripts**:
   - Auto-refresh expired tokens
   - Generate dynamic data
   - Set up test data

3. **Use Tests Tab**:
   - Validate responses
   - Extract data
   - Chain requests

4. **Export Results**:
   - Export collection runs
   - Share with team
   - Document API behavior

## Additional Resources

- API Documentation: http://localhost:8082/swagger-ui.html
- Project README: ../README.md
- Service Documentation: ../hr-service/README.md

## Support

For issues or questions:
- Check Swagger documentation
- Review service logs
- Contact development team
