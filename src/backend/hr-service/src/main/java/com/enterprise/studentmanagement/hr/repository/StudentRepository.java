package com.enterprise.studentmanagement.hr.repository;

import com.enterprise.studentmanagement.hr.entity.Student;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Student Repository
 * Data access layer for Student entity
 */
@Repository
public interface StudentRepository extends JpaRepository<Student, UUID> {

    /**
     * Find student by user ID
     */
    Optional<Student> findByUserId(UUID userId);

    /**
     * Find student by student code
     */
    Optional<Student> findByStudentCode(String studentCode);

    /**
     * Check if student code exists
     */
    boolean existsByStudentCode(String studentCode);

    /**
     * Check if user ID exists
     */
    boolean existsByUserId(UUID userId);

    /**
     * Find students by status
     */
    Page<Student> findByStatus(Student.StudentStatus status, Pageable pageable);

    /**
     * Search students by name
     */
    @Query("SELECT s FROM Student s WHERE LOWER(CONCAT(s.firstName, ' ', s.lastName)) LIKE LOWER(CONCAT('%', :name, '%'))")
    Page<Student> searchByName(String name, Pageable pageable);

    /**
     * Check if email exists
     */
    boolean existsByEmail(String email);

    /**
     * Count students by status
     */
    long countByStatus(Student.StudentStatus status);

    /**
     * Find students by major
     */
    Page<Student> findByMajor(String major, Pageable pageable);

    /**
     * Find students by academic year
     */
    Page<Student> findByAcademicYear(String academicYear, Pageable pageable);

    /**
     * Find students by advisor ID
     */
    Page<Student> findByAdvisorId(UUID advisorId, Pageable pageable);
}
