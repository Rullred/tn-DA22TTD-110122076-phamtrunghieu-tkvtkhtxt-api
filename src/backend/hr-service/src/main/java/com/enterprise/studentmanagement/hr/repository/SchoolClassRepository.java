package com.enterprise.studentmanagement.hr.repository;

import com.enterprise.studentmanagement.hr.entity.SchoolClass;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * School Class Repository
 * Data access layer for SchoolClass entity
 */
@Repository
public interface SchoolClassRepository extends JpaRepository<SchoolClass, UUID> {

    /**
     * Find class by class code
     */
    Optional<SchoolClass> findByClassCode(String classCode);

    /**
     * Check if class code exists
     */
    boolean existsByClassCode(String classCode);

    /**
     * Find classes by teacher ID
     */
    Page<SchoolClass> findByTeacherId(UUID teacherId, Pageable pageable);

    /**
     * Find classes by academic year
     */
    Page<SchoolClass> findByAcademicYear(String academicYear, Pageable pageable);

    /**
     * Find classes by semester
     */
    Page<SchoolClass> findBySemester(Integer semester, Pageable pageable);

    /**
     * Find classes by academic year and semester
     */
    Page<SchoolClass> findByAcademicYearAndSemester(String academicYear, Integer semester, Pageable pageable);

    /**
     * Find classes by status
     */
    Page<SchoolClass> findByStatus(SchoolClass.ClassStatus status, Pageable pageable);

    /**
     * Search classes by name
     */
    @Query("SELECT c FROM SchoolClass c WHERE LOWER(c.className) LIKE LOWER(CONCAT('%', :name, '%'))")
    Page<SchoolClass> searchByName(String name, Pageable pageable);

    /**
     * Find classes by subject
     */
    Page<SchoolClass> findBySubject(String subject, Pageable pageable);

    /**
     * Find active classes by teacher
     */
    List<SchoolClass> findByTeacherIdAndStatus(UUID teacherId, SchoolClass.ClassStatus status);

    /**
     * Count classes by status
     */
    long countByStatus(SchoolClass.ClassStatus status);

    /**
     * Find classes by academic year and status
     */
    Page<SchoolClass> findByAcademicYearAndStatus(String academicYear, SchoolClass.ClassStatus status, Pageable pageable);

    /**
     * Find classes by academic year, semester, and status
     */
    Page<SchoolClass> findByAcademicYearAndSemesterAndStatus(
        String academicYear, Integer semester, SchoolClass.ClassStatus status, Pageable pageable);
}
