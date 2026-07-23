package com.enterprise.studentmanagement.hr.service;

import com.enterprise.studentmanagement.hr.dto.*;
import com.enterprise.studentmanagement.hr.entity.Teacher;
import com.enterprise.studentmanagement.hr.exception.BadRequestException;
import com.enterprise.studentmanagement.hr.exception.ResourceNotFoundException;
import com.enterprise.studentmanagement.hr.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Teacher Service
 * Business logic for teacher management
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TeacherService {

    private final TeacherRepository teacherRepository;
    private final JdbcTemplate jdbcTemplate;

    /**
     * Get all teachers with pagination
     */
    @Transactional(readOnly = true)
    public PageResponse<TeacherDto> getAllTeachers(Pageable pageable) {
        log.info("Fetching all teachers, page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        
        Page<Teacher> teacherPage = teacherRepository.findAll(pageable);
        Page<TeacherDto> dtoPage = teacherPage.map(TeacherDto::fromEntity);
        
        return PageResponse.fromPage(dtoPage);
    }

    /**
     * Get teacher by ID
     */
    @Transactional(readOnly = true)
    public TeacherDto getTeacherById(UUID id) {
        log.info("Fetching teacher by ID: {}", id);
        
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", "id", id));
        
        return TeacherDto.fromEntity(teacher);
    }

    /**
     * Lấy hồ sơ giáo viên của người dùng hiện tại theo userId (nguoi_dung_id),
     * fallback theo email. Dùng cho endpoint /me — tra chính xác 1 lần thay vì quét toàn bộ.
     */
    @Transactional(readOnly = true)
    public TeacherDto getCurrentTeacher(UUID userId, String email) {
        Teacher teacher = null;
        if (userId != null) {
            teacher = teacherRepository.findByUserId(userId).orElse(null);
        }
        if (teacher == null && email != null && !email.isBlank()) {
            teacher = teacherRepository.findByEmail(email.trim()).orElse(null);
        }
        if (teacher == null) {
            throw new ResourceNotFoundException("Teacher", "current user", userId != null ? userId : email);
        }
        return TeacherDto.fromEntity(teacher);
    }

    /**
     * Get teacher by teacher code
     */
    @Transactional(readOnly = true)
    public TeacherDto getTeacherByCode(String teacherCode) {
        log.info("Fetching teacher by code: {}", teacherCode);
        
        Teacher teacher = teacherRepository.findByTeacherCode(teacherCode)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", "teacherCode", teacherCode));
        
        return TeacherDto.fromEntity(teacher);
    }

    /**
     * Search teachers by name
     */
    @Transactional(readOnly = true)
    public PageResponse<TeacherDto> searchTeachersByName(String name, Pageable pageable) {
        log.info("Searching teachers by name: {}", name);
        
        Page<Teacher> teacherPage = teacherRepository.searchByName(name, pageable);
        Page<TeacherDto> dtoPage = teacherPage.map(TeacherDto::fromEntity);
        
        return PageResponse.fromPage(dtoPage);
    }

    /**
     * Get teachers by department
     */
    @Transactional(readOnly = true)
    public PageResponse<TeacherDto> getTeachersByDepartment(String department, Pageable pageable) {
        log.info("Fetching teachers by department: {}", department);
        
        Page<Teacher> teacherPage = teacherRepository.findByDepartment(department, pageable);
        Page<TeacherDto> dtoPage = teacherPage.map(TeacherDto::fromEntity);
        
        return PageResponse.fromPage(dtoPage);
    }

    /**
     * Get teachers by status
     */
    @Transactional(readOnly = true)
    public PageResponse<TeacherDto> getTeachersByStatus(Teacher.TeacherStatus status, Pageable pageable) {
        log.info("Fetching teachers by status: {}", status);
        
        Page<Teacher> teacherPage = teacherRepository.findByStatus(status, pageable);
        Page<TeacherDto> dtoPage = teacherPage.map(TeacherDto::fromEntity);
        
        return PageResponse.fromPage(dtoPage);
    }

    /**
     * Create a new teacher
     */
    @Transactional
    public TeacherDto createTeacher(CreateTeacherRequest request) {
        log.info("Creating new teacher: {} {}", request.getFirstName(), request.getLastName());
        
        // Validate user exists in IAM/central users table before inserting the profile
        if (!userExists(request.getUserId())) {
            throw new BadRequestException("User not found: " + request.getUserId());
        }

        // Validate userId uniqueness (1 user <-> 1 teacher)
        if (teacherRepository.existsByUserId(request.getUserId())) {
            throw new BadRequestException("User already has a teacher profile: " + request.getUserId());
        }

        // Validate email uniqueness
        if (teacherRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already exists: " + request.getEmail());
        }
        
        // Generate unique teacher code
        String teacherCode = generateTeacherCode();
        
        // Create teacher entity
        Teacher teacher = Teacher.builder()
                .userId(request.getUserId())
                .teacherCode(teacherCode)
                .firstName(request.getFirstName())
                .lastName(request.getLastName())
                .email(request.getEmail())
                .phoneNumber(request.getPhoneNumber())
                .dateOfBirth(request.getDateOfBirth())
                .gender(request.getGender())
                .address(request.getAddress())
                .department(request.getDepartment())
                .specialization(request.getSpecialization())
                .status(Teacher.TeacherStatus.HOAT_DONG)
                .hireDate(request.getHireDate())
                .build();
        
        teacher = teacherRepository.save(teacher);
        
        log.info("Teacher created successfully with ID: {} and code: {}", teacher.getId(), teacher.getTeacherCode());
        
        return TeacherDto.fromEntity(teacher);
    }

    /**
     * Update teacher
     */
    @Transactional
    public TeacherDto updateTeacher(UUID id, UpdateTeacherRequest request) {
        log.info("Updating teacher with ID: {}", id);
        
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", "id", id));
        
        // Validate email uniqueness if changed
        if (request.getEmail() != null && !request.getEmail().equals(teacher.getEmail())) {
            if (teacherRepository.existsByEmail(request.getEmail())) {
                throw new BadRequestException("Email already exists: " + request.getEmail());
            }
        }
        
        // Update fields
        if (request.getFirstName() != null) {
            teacher.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            teacher.setLastName(request.getLastName());
        }
        if (request.getEmail() != null) {
            teacher.setEmail(request.getEmail());
        }
        if (request.getPhoneNumber() != null) {
            teacher.setPhoneNumber(request.getPhoneNumber());
        }
        if (request.getDateOfBirth() != null) {
            teacher.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getGender() != null) {
            teacher.setGender(request.getGender());
        }
        if (request.getAddress() != null) {
            teacher.setAddress(request.getAddress());
        }
        if (request.getDepartment() != null) {
            teacher.setDepartment(request.getDepartment());
        }
        if (request.getSpecialization() != null) {
            teacher.setSpecialization(request.getSpecialization());
        }
        if (request.getStatus() != null) {
            teacher.setStatus(request.getStatus());
        }
        
        teacher = teacherRepository.save(teacher);
        
        log.info("Teacher updated successfully: {}", id);
        
        return TeacherDto.fromEntity(teacher);
    }

    /**
     * Delete teacher
     */
    @Transactional
    public void deleteTeacher(UUID id) {
        log.info("Deleting teacher with ID: {}", id);
        
        if (!teacherRepository.existsById(id)) {
            throw new ResourceNotFoundException("Teacher", "id", id);
        }
        
        teacherRepository.deleteById(id);
        
        log.info("Teacher deleted successfully: {}", id);
    }

    /**
     * Update teacher avatar
     */
    @Transactional
    public TeacherDto updateTeacherAvatar(UUID id, String avatarUrl) {
        log.info("Updating avatar for teacher: {}", id);
        
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", "id", id));
        
        teacher.setAvatarUrl(avatarUrl);
        teacher = teacherRepository.save(teacher);
        
        log.info("Teacher avatar updated successfully: {}", id);
        
        return TeacherDto.fromEntity(teacher);
    }

    /**
     * Generate unique teacher code
     */
    private String generateTeacherCode() {
        String code;
        do {
            code = "TCH" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (teacherRepository.existsByTeacherCode(code));
        return code;
    }

    /**
     * Count teachers by status
     */
    @Transactional(readOnly = true)
    public long countTeachersByStatus(Teacher.TeacherStatus status) {
        return teacherRepository.countByStatus(status);
    }

    /**
     * Count teachers by department
     */
    @Transactional(readOnly = true)
    public long countTeachersByDepartment(String department) {
        return teacherRepository.countByDepartment(department);
    }

    /**
     * Count all teachers
     */
    @Transactional(readOnly = true)
    public long countAllTeachers() {
        return teacherRepository.count();
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
}
