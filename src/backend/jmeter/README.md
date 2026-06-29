# JMeter Load Testing - Enterprise Student Management System

## Overview

This directory contains JMeter test plans for load and performance testing of the Enterprise Student Management System.

## Prerequisites

### Install JMeter

**macOS**:
```bash
brew install jmeter
```

**Windows**:
```bash
choco install jmeter
```

**Linux**:
```bash
# Download from https://jmeter.apache.org/download_jmeter.cgi
wget https://dlcdn.apache.org//jmeter/binaries/apache-jmeter-5.6.3.tgz
tar -xzf apache-jmeter-5.6.3.tgz
```

**Manual Installation**:
1. Download from https://jmeter.apache.org/
2. Extract to desired location
3. Add `bin` directory to PATH

## Test Plans

### 1. Authentication Load Test
**File**: `auth-load-test.jmx`

Tests authentication endpoints under load:
- Login requests
- Token refresh
- Concurrent users: 100
- Ramp-up: 10 seconds
- Duration: 60 seconds

**Run**:
```bash
jmeter -n -t auth-load-test.jmx -l results/auth-results.jtl -e -o results/auth-report
```

### 2. Student API Load Test
**File**: `student-api-load-test.jmx`

Tests student CRUD operations:
- Get all students
- Get student by ID
- Create student
- Update student
- Concurrent users: 50
- Ramp-up: 5 seconds
- Duration: 120 seconds

**Run**:
```bash
jmeter -n -t student-api-load-test.jmx -l results/student-results.jtl -e -o results/student-report
```

### 3. Full System Load Test
**File**: `full-system-load-test.jmx`

Tests complete system workflow:
- Authentication
- Student operations
- Teacher operations
- Class operations
- Enrollment operations
- Concurrent users: 200
- Ramp-up: 20 seconds
- Duration: 300 seconds (5 minutes)

**Run**:
```bash
jmeter -n -t full-system-load-test.jmx -l results/full-results.jtl -e -o results/full-report
```

## Test Configuration

### User Variables

All test plans use these variables (configurable):

| Variable | Default | Description |
|----------|---------|-------------|
| BASE_URL | localhost | Server hostname |
| PORT | 8080 | API Gateway port |
| PROTOCOL | http | Protocol (http/https) |
| THREADS | 100 | Number of concurrent users |
| RAMP_UP | 10 | Ramp-up time in seconds |
| DURATION | 60 | Test duration in seconds |
| ADMIN_USERNAME | admin | Admin username |
| ADMIN_PASSWORD | Admin@123 | Admin password |

### Modify Variables

**Command Line**:
```bash
jmeter -n -t test-plan.jmx \
  -JBASE_URL=api.example.com \
  -JPORT=443 \
  -JPROTOCOL=https \
  -JTHREADS=200 \
  -l results.jtl
```

**GUI Mode**:
1. Open test plan in JMeter GUI
2. Navigate to "User Defined Variables"
3. Modify values
4. Save test plan

## Running Tests

### GUI Mode (Development)

```bash
jmeter -t auth-load-test.jmx
```

Use GUI mode for:
- Test plan development
- Debugging
- Result visualization
- Configuration

### Non-GUI Mode (Production)

```bash
jmeter -n -t test-plan.jmx -l results.jtl -e -o report-folder
```

Parameters:
- `-n`: Non-GUI mode
- `-t`: Test plan file
- `-l`: Results log file
- `-e`: Generate report dashboard
- `-o`: Output folder for report

### Distributed Testing

For high load testing across multiple machines:

**Master**:
```bash
jmeter -n -t test-plan.jmx -R server1,server2,server3 -l results.jtl
```

**Slaves**:
```bash
jmeter-server
```

## Test Scenarios

### Scenario 1: Normal Load
- Users: 50
- Ramp-up: 10 seconds
- Duration: 60 seconds
- Expected: All requests successful, < 200ms response time

### Scenario 2: Peak Load
- Users: 200
- Ramp-up: 20 seconds
- Duration: 120 seconds
- Expected: > 95% success rate, < 500ms response time

### Scenario 3: Stress Test
- Users: 500
- Ramp-up: 30 seconds
- Duration: 300 seconds
- Expected: System remains stable, graceful degradation

### Scenario 4: Spike Test
- Users: 0 → 300 → 0
- Ramp-up: 5 seconds
- Duration: 60 seconds
- Expected: System recovers, no crashes

### Scenario 5: Endurance Test
- Users: 100
- Ramp-up: 10 seconds
- Duration: 3600 seconds (1 hour)
- Expected: No memory leaks, stable performance

## Performance Metrics

### Key Metrics

1. **Response Time**
   - Average: < 200ms
   - 90th Percentile: < 500ms
   - 95th Percentile: < 1000ms
   - Max: < 2000ms

2. **Throughput**
   - Login: > 100 req/sec
   - Get Students: > 200 req/sec
   - Create Student: > 150 req/sec
   - Overall: > 500 req/sec

3. **Error Rate**
   - Target: < 1%
   - Acceptable: < 5%
   - Critical: > 10%

4. **Resource Usage**
   - CPU: < 70%
   - Memory: < 80%
   - Database Connections: < 80% of pool

### Assertions

Each test includes assertions for:
- Response code (200, 201, etc.)
- Response time (< threshold)
- Response body (contains expected data)
- JSON structure validation

## Results Analysis

### View HTML Report

```bash
# Open generated report
open results/auth-report/index.html
```

### Key Report Sections

1. **Dashboard**
   - Overall statistics
   - Error rate
   - Response time graph

2. **Statistics**
   - Request counts
   - Min/Max/Average times
   - Throughput
   - Error percentage

3. **Response Times**
   - Over time graph
   - Percentiles
   - Distribution

4. **Throughput**
   - Requests per second
   - Over time graph

5. **Errors**
   - Error types
   - Error messages
   - Failed requests

### Analyze Results File

```bash
# View raw results
cat results/auth-results.jtl

# Count errors
grep "false" results/auth-results.jtl | wc -l

# Average response time
awk -F',' '{sum+=$2; count++} END {print sum/count}' results/auth-results.jtl
```

## Test Data

### Sample Users

Create test users before running tests:

```bash
# Create 100 test students
for i in {1..100}; do
  curl -X POST http://localhost:8080/api/students \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"firstName\": \"Student$i\",
      \"lastName\": \"Test\",
      \"email\": \"student$i@test.com\",
      \"dateOfBirth\": \"2000-01-01\",
      \"gender\": \"MALE\",
      \"enrollmentDate\": \"2024-09-01\"
    }"
done
```

### CSV Data Files

Use CSV files for parameterized testing:

**students.csv**:
```csv
firstName,lastName,email
John,Doe,john.doe@test.com
Jane,Smith,jane.smith@test.com
Bob,Johnson,bob.johnson@test.com
```

**Configure in JMeter**:
1. Add "CSV Data Set Config"
2. Set filename: `students.csv`
3. Variable names: `firstName,lastName,email`
4. Use variables: `${firstName}`, `${lastName}`, `${email}`

## Monitoring During Tests

### System Monitoring

```bash
# Monitor Docker containers
docker stats

# Monitor specific service
docker stats hr-service

# View logs
docker-compose logs -f hr-service
```

### Database Monitoring

```bash
# Connect to database
docker exec -it hr-postgres psql -U hr_user -d hr_db

# Check active connections
SELECT count(*) FROM pg_stat_activity;

# Check slow queries
SELECT query, calls, total_time, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### Application Metrics

```bash
# Check actuator metrics
curl http://localhost:8082/actuator/metrics

# Check health
curl http://localhost:8082/actuator/health

# Check specific metric
curl http://localhost:8082/actuator/metrics/jvm.memory.used
```

## Troubleshooting

### High Error Rate

**Possible Causes**:
- Server overload
- Database connection pool exhausted
- Rate limiting triggered
- Network issues

**Solutions**:
- Reduce concurrent users
- Increase ramp-up time
- Scale services
- Increase connection pool size

### Slow Response Times

**Possible Causes**:
- Database queries not optimized
- Missing indexes
- Insufficient resources
- Network latency

**Solutions**:
- Add database indexes
- Optimize queries
- Increase server resources
- Use caching

### Connection Timeouts

**Possible Causes**:
- Server not responding
- Network issues
- Firewall blocking

**Solutions**:
- Increase timeout settings
- Check server status
- Verify network connectivity

### Out of Memory

**Possible Causes**:
- Memory leak
- Insufficient heap size
- Too many concurrent requests

**Solutions**:
- Increase JVM heap size
- Fix memory leaks
- Reduce concurrent users

## Best Practices

1. **Start Small**
   - Begin with low load
   - Gradually increase
   - Find breaking point

2. **Use Realistic Data**
   - Real-world scenarios
   - Varied data
   - Edge cases

3. **Monitor Everything**
   - Application metrics
   - Database performance
   - System resources

4. **Test Regularly**
   - Before releases
   - After changes
   - Scheduled tests

5. **Document Results**
   - Baseline metrics
   - Performance trends
   - Issues found

6. **Clean Up**
   - Remove test data
   - Reset database
   - Clear caches

## CI/CD Integration

### GitHub Actions

```yaml
name: Load Tests

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Start services
        run: docker-compose up -d
      
      - name: Wait for services
        run: sleep 60
      
      - name: Install JMeter
        run: |
          wget https://dlcdn.apache.org//jmeter/binaries/apache-jmeter-5.6.3.tgz
          tar -xzf apache-jmeter-5.6.3.tgz
      
      - name: Run load tests
        run: |
          apache-jmeter-5.6.3/bin/jmeter -n \
            -t jmeter/auth-load-test.jmx \
            -l results.jtl \
            -e -o report
      
      - name: Upload results
        uses: actions/upload-artifact@v2
        with:
          name: jmeter-results
          path: report/
```

## Additional Resources

- [JMeter Documentation](https://jmeter.apache.org/usermanual/index.html)
- [JMeter Best Practices](https://jmeter.apache.org/usermanual/best-practices.html)
- [Performance Testing Guide](https://www.guru99.com/performance-testing.html)

---

**Happy Load Testing!** 📊
