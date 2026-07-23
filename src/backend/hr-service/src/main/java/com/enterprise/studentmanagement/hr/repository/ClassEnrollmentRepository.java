package com.enterprise.studentmanagement.hr.repository;

import com.enterprise.studentmanagement.hr.entity.ClassEnrollment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Class Enrollment Repository
 * Data access layer for ClassEnrollment entity
 */
@Repository
public interface ClassEnrollmentRepository extends JpaRepository<ClassEnrollment, UUID> {

    /**
     * Find enrollment by class and student
     */
    Optional<ClassEnrollment> findByClassIdAndStudentId(UUID classId, UUID studentId);

    /**
     * Check if enrollment exists
     */
    boolean existsByClassIdAndStudentId(UUID classId, UUID studentId);

    /**
     * Find all enrollments for a class
     */
    Page<ClassEnrollment> findByClassId(UUID classId, Pageable pageable);

    /**
     * Find all enrollments for a student
     */
    Page<ClassEnrollment> findByStudentId(UUID studentId, Pageable pageable);

    /**
     * Find all enrollments for a student (unpaged) — used for academic progress.
     */
    List<ClassEnrollment> findByStudentId(UUID studentId);

    /**
     * Find enrollments by class and status
     */
    List<ClassEnrollment> findByClassIdAndStatus(UUID classId, ClassEnrollment.EnrollmentStatus status);

    /**
     * Find enrollments by student and status
     */
    List<ClassEnrollment> findByStudentIdAndStatus(UUID studentId, ClassEnrollment.EnrollmentStatus status);

    /**
     * Count enrollments for a class
     */
    long countByClassId(UUID classId);

    /**
     * Count active enrollments for a class
     */
    long countByClassIdAndStatus(UUID classId, ClassEnrollment.EnrollmentStatus status);

    /**
     * Find all students in a class
     */
    @Query("SELECT e FROM ClassEnrollment e WHERE e.classId = :classId AND e.status = 'DA_DANG_KY'")
    List<ClassEnrollment> findActiveEnrollmentsByClassId(UUID classId);

    /**
     * Find all classes for a student
     */
    @Query("SELECT e FROM ClassEnrollment e WHERE e.studentId = :studentId AND e.status = 'DA_DANG_KY'")
    List<ClassEnrollment> findActiveEnrollmentsByStudentId(UUID studentId);

    /**
     * Check if enrollment exists with specific status
     */
    boolean existsByClassIdAndStudentIdAndStatus(UUID classId, UUID studentId, ClassEnrollment.EnrollmentStatus status);
}
