package com.enterprise.studentmanagement.hr.repository;

import com.enterprise.studentmanagement.hr.entity.LearningItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository cho mục học tập của lớp học phần.
 */
@Repository
public interface LearningItemRepository extends JpaRepository<LearningItem, UUID> {

    List<LearningItem> findByClassIdOrderByOrderIndexAscCreatedAtAsc(UUID classId);
}
