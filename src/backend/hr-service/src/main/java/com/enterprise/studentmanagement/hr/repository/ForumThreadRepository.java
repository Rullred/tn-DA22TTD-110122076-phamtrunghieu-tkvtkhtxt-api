package com.enterprise.studentmanagement.hr.repository;

import com.enterprise.studentmanagement.hr.entity.ForumThread;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ForumThreadRepository extends JpaRepository<ForumThread, UUID> {
    List<ForumThread> findByClassIdOrderByCreatedAtDesc(UUID classId);
}
