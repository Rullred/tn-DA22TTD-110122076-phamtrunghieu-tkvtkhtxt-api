package com.enterprise.studentmanagement.hr.repository;

import com.enterprise.studentmanagement.hr.entity.AssignmentSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Repository cho bài nộp của sinh viên.
 */
@Repository
public interface AssignmentSubmissionRepository extends JpaRepository<AssignmentSubmission, UUID> {

    List<AssignmentSubmission> findByItemIdOrderBySubmittedAtDesc(UUID itemId);

    Optional<AssignmentSubmission> findByItemIdAndStudentId(UUID itemId, UUID studentId);

    long countByItemId(UUID itemId);
}
