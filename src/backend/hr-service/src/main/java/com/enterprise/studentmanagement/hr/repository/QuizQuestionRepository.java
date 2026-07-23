package com.enterprise.studentmanagement.hr.repository;

import com.enterprise.studentmanagement.hr.entity.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Quiz Question Repository — câu hỏi của một bài trắc nghiệm.
 */
@Repository
public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, UUID> {

    List<QuizQuestion> findByQuizIdOrderByOrderIndexAsc(UUID quizId);

    List<QuizQuestion> findByQuizIdAndEnabledTrue(UUID quizId);

    long countByQuizIdAndEnabledTrue(UUID quizId);

    void deleteByQuizId(UUID quizId);
}
