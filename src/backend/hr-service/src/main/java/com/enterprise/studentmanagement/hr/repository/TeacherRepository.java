package com.enterprise.studentmanagement.hr.repository;

import com.enterprise.studentmanagement.hr.entity.Teacher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Teacher Repository
 * Data access layer for Teacher entity
 */
@Repository
public interface TeacherRepository extends JpaRepository<Teacher, UUID> {

    /**
     * Find teacher by user ID
     */
    Optional<Teacher> findByUserId(UUID userId);

    /**
     * Find teacher by teacher code
     */
    Optional<Teacher> findByTeacherCode(String teacherCode);

    /**
     * Check if teacher code exists
     */
    boolean existsByTeacherCode(String teacherCode);

    /**
     * Check if user ID exists
     */
    boolean existsByUserId(UUID userId);

    /**
     * Find teachers by status
     */
    Page<Teacher> findByStatus(Teacher.TeacherStatus status, Pageable pageable);

    /**
     * Search teachers by name
     */
    @Query("SELECT t FROM Teacher t WHERE LOWER(CONCAT(t.firstName, ' ', t.lastName)) LIKE LOWER(CONCAT('%', :name, '%'))")
    Page<Teacher> searchByName(String name, Pageable pageable);

    /**
     * Check if email exists
     */
    boolean existsByEmail(String email);

    /**
     * Count teachers by status
     */
    long countByStatus(Teacher.TeacherStatus status);

    /**
     * Count teachers by department
     */
    long countByDepartment(String department);

    /**
     * Find teachers by department
     */
    Page<Teacher> findByDepartment(String department, Pageable pageable);

    /**
     * Find teachers by specialization
     */
    Page<Teacher> findBySpecialization(String specialization, Pageable pageable);
}
