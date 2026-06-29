package com.enterprise.studentmanagement.hr;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;

/**
 * HR Service Application
 * Human Resource Management Service for Enterprise Student Management System
 * 
 * Responsibilities:
 * - Student management (CRUD, enrollment)
 * - Teacher management (CRUD, class assignment)
 * - Class management (CRUD, enrollment)
 * - File upload (avatars)
 * - Authorization (role-based access control)
 */
@SpringBootApplication
@EnableDiscoveryClient
public class HrServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(HrServiceApplication.class, args);
    }

}
