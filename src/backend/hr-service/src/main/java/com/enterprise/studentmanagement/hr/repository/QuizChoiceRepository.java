package com.enterprise.studentmanagement.hr.repository;

import com.enterprise.studentmanagement.hr.entity.QuizChoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Quiz Choice Repository — các lựa chọn của câu hỏi.
 */
@Repository
public interface QuizChoiceRepository extends JpaRepository<QuizChoice, UUID> {

    List<QuizChoice> findByQuestionIdOrderByOrderIndexAsc(UUID questionId);

    List<QuizChoice> findByQuestionIdIn(List<UUID> questionIds);

    void deleteByQuestionId(UUID questionId);

    void deleteByQuestionIdIn(List<UUID> questionIds);
}
