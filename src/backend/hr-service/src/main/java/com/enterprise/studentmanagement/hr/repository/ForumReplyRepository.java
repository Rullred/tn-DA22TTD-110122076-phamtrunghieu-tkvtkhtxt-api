package com.enterprise.studentmanagement.hr.repository;

import com.enterprise.studentmanagement.hr.entity.ForumReply;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ForumReplyRepository extends JpaRepository<ForumReply, UUID> {
    List<ForumReply> findByThreadIdOrderByCreatedAtAsc(UUID threadId);
    long countByThreadId(UUID threadId);
}
