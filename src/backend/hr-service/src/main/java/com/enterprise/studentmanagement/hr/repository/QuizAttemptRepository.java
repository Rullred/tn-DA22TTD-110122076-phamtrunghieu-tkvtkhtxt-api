package com.enterprise.studentmanagement.hr.repository;

import com.enterprise.studentmanagement.hr.entity.QuizAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Quiz Attempt Repository — lượt làm bài của sinh viên.
 */
@Repository
public interface QuizAttemptRepository extends JpaRepository<QuizAttempt, UUID> {

    List<QuizAttempt> findByQuizId(UUID quizId);

    List<QuizAttempt> findByQuizIdAndStudentId(UUID quizId, UUID studentId);

    List<QuizAttempt> findByQuizIdAndStatus(UUID quizId, QuizAttempt.AttemptStatus status);

    void deleteByQuizId(UUID quizId);
}
