package com.enterprise.studentmanagement.hr.service;

import com.enterprise.studentmanagement.hr.dto.*;
import com.enterprise.studentmanagement.hr.entity.Student;
import com.enterprise.studentmanagement.hr.exception.BadRequestException;
import com.enterprise.studentmanagement.hr.exception.ResourceNotFoundException;
import com.enterprise.studentmanagement.hr.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Student Service
 * Business logic for student management
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class StudentService {

    private final StudentRepository studentRepository;
    private final JdbcTemplate jdbcTemplate;

    /**
     * Get all students with pagination
     */
    @Transactional(readOnly = true)
    public PageResponse<StudentDto> getAllStudents(Pageable pageable) {
        log.info("Fetching all students, page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        
        Page<Student> studentPage = studentRepository.findAll(pageable);
        Page<StudentDto> dtoPage = studentPage.map(StudentDto::fromEntity);
        
        return PageResponse.fromPage(dtoPage);
    }

    /**
     * Get student by ID
     */
    @Transactional(readOnly = true)
    public StudentDto getStudentById(UUID id) {
        log.info("Fetching student by ID: {}", id);
        
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", id));
        
        return StudentDto.fromEntity(student);
    }

    /**
     * Get student by student code
     */
    @Transactional(readOnly = true)
    public StudentDto getStudentByCode(String studentCode) {
        log.info("Fetching student by code: {}", studentCode);
        
        Student student = studentRepository.findByStudentCode(studentCode)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "studentCode", studentCode));
        
        return StudentDto.fromEntity(student);
    }

    /**
     * Search students by name
     */
    @Transactional(readOnly = true)
    public PageResponse<StudentDto> searchStudentsByName(String name, Pageable pageable) {
        log.info("Searching students by name: {}", name);
        
        Page<Student> studentPage = studentRepository.searchByName(name, pageable);
        Page<StudentDto> dtoPage = studentPage.map(StudentDto::fromEntity);
        
        return PageResponse.fromPage(dtoPage);
    }

    /**
     * Get students by status
     */
    @Transactional(readOnly = true)
    public PageResponse<StudentDto> getStudentsByStatus(Student.StudentStatus status, Pageable pageable) {
        log.info("Fetching students by status: {}", status);
        
        Page<Student> studentPage = studentRepository.findByStatus(status, pageable);
        Page<StudentDto> dtoPage = studentPage.map(StudentDto::fromEntity);
        
        return PageResponse.fromPage(dtoPage);
    }

    /**
     * Create a new student
     */
    @Transactional
    public StudentDto createStudent(CreateStudentRequest request) {
        log.info("Creating new student: {} {}", request.getFirstName(), request.getLastName());

        // Validate user exists in IAM/central users table before inserting the profile
        if (!userExists(request.getUserId())) {
            throw new BadRequestException("User not found: " + request.getUserId());
        }

        // Validate userId uniqueness (1 user <-> 1 student)
        if (studentRepository.existsByUserId(request.getUserId())) {
            throw new BadRequestException("User already has a student profile: " + request.getUserId());
        }
        
        // Validate email uniqueness
        if (studentRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists: " + request.getEmail());
        }
        
        // Generate unique student code
        String studentCode = generateStudentCode();
        
        // Create student entity
        Student student = Student.builder()
            .userId(request.getUserId())
                .studentCode(studentCode)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .address(request.getAddress())
                .status(Student.StudentStatus.HOAT_DONG)
                .enrollmentDate(request.getEnrollmentDate())
                .build();
        
        student = studentRepository.save(student);
        
        log.info("Student created successfully with ID: {} and code: {}", student.getId(), student.getStudentCode());
        
        return StudentDto.fromEntity(student);
    }

    /**
     * Update student
     */
    @Transactional
    public StudentDto updateStudent(UUID id, UpdateStudentRequest request) {
        log.info("Updating student with ID: {}", id);
        
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", id));
        
        // Validate email uniqueness if changed
        if (request.getEmail() != null && !request.getEmail().equals(student.getEmail())) {
            if (studentRepository.existsByEmail(request.getEmail())) {
                throw new BadRequestException("Email already exists: " + request.getEmail());
            }
        }
        
        // Update fields
        if (request.getFirstName() != null) {
            student.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            student.setLastName(request.getLastName());
        }
        if (request.getEmail() != null) {
            student.setEmail(request.getEmail());
        }
        if (request.getPhoneNumber() != null) {
            student.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getDateOfBirth() != null) {
            student.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getGender() != null) {
            student.setGender(request.getGender());
        }
        if (request.getAddress() != null) {
            student.setAddress(request.getAddress());
        }
        if (request.getStatus() != null) {
            student.setStatus(request.getStatus());
        }
        
        student = studentRepository.save(student);
        
        log.info("Student updated successfully: {}", id);
        
        return StudentDto.fromEntity(student);
    }

    /**
     * Delete student
     */
    @Transactional
    public void deleteStudent(UUID id) {
        log.info("Deleting student with ID: {}", id);
        
        if (!studentRepository.existsById(id)) {
            throw new ResourceNotFoundException("Student", "id", id);
        }
        
        studentRepository.deleteById(id);
        
        log.info("Student deleted successfully: {}", id);
    }

    /**
     * Update student avatar
     */
    @Transactional
    public StudentDto updateStudentAvatar(UUID id, String avatarUrl) {
        log.info("Updating avatar for student: {}", id);
        
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", id));
        
        student.setAvatarUrl(avatarUrl);
        student = studentRepository.save(student);
        
        log.info("Student avatar updated successfully: {}", id);
        
        return StudentDto.fromEntity(student);
    }

    /**
     * Generate unique student code
     */
    private String generateStudentCode() {
        String code;
        do {
            code = "STU" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (studentRepository.existsByStudentCode(code));
        return code;
    }

    /**
     * Check whether the referenced user exists.
     */
    private boolean userExists(UUID userId) {
        Integer count = jdbcTemplate.queryForObject(
                "SELECT COUNT(1) FROM nguoi_dung WHERE id = ?",
                Integer.class,
                userId);

        return count != null && count > 0;
    }

    /**
     * Count students by status
     */
    @Transactional(readOnly = true)
    public long countStudentsByStatus(Student.StudentStatus status) {
        return studentRepository.countByStatus(status);
    }

    /**
     * Count all students
     */
    @Transactional(readOnly = true)
    public long countAllStudents() {
        return studentRepository.count();
    }

    /**
     * Update conduct score (for advisor)
     */
    @Transactional
    public StudentDto updateConductScore(UUID studentId, Integer conductScore) {
        log.info("Updating conduct score for student: {}, score: {}", studentId, conductScore);
        
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", studentId));
        
        student.setConductScore(conductScore);
        student = studentRepository.save(student);
        
        log.info("Conduct score updated successfully for student: {}", studentId);
        
        return StudentDto.fromEntity(student);
    }

    /**
     * Get students by advisor
     */
    @Transactional(readOnly = true)
    public PageResponse<StudentDto> getStudentsByAdvisor(UUID advisorId, Pageable pageable) {
        log.info("Fetching students by advisor: {}", advisorId);
        
        Page<Student> studentPage = studentRepository.findByAdvisorId(advisorId, pageable);
        Page<StudentDto> dtoPage = studentPage.map(StudentDto::fromEntity);
        
        return PageResponse.fromPage(dtoPage);
    }
}
