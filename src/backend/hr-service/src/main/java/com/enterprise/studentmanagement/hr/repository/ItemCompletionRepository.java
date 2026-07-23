package com.enterprise.studentmanagement.hr.repository;

import com.enterprise.studentmanagement.hr.entity.ItemCompletion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ItemCompletionRepository extends JpaRepository<ItemCompletion, UUID> {
    boolean existsByItemIdAndStudentId(UUID itemId, UUID studentId);
    void deleteByItemIdAndStudentId(UUID itemId, UUID studentId);
    List<ItemCompletion> findByStudentIdAndItemIdIn(UUID studentId, List<UUID> itemIds);
}
