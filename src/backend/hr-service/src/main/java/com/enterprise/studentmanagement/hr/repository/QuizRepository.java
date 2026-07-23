package com.enterprise.studentmanagement.hr.repository;

import com.enterprise.studentmanagement.hr.entity.Quiz;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Quiz Repository — data access cho bài trắc nghiệm.
 */
@Repository
public interface QuizRepository extends JpaRepository<Quiz, UUID> {

    List<Quiz> findByClassIdOrderByCreatedAtDesc(UUID classId);

    List<Quiz> findByClassIdInAndStatus(List<UUID> classIds, Quiz.QuizStatus status);
}
