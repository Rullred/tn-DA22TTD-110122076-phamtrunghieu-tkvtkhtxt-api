package com.enterprise.studentmanagement.hr.repository;

import com.enterprise.studentmanagement.hr.entity.TeachingProposal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TeachingProposalRepository extends JpaRepository<TeachingProposal, UUID> {
    List<TeachingProposal> findByOrderByCreatedAtDesc();
    List<TeachingProposal> findByStatusOrderByCreatedAtDesc(TeachingProposal.ProposalStatus status);
    List<TeachingProposal> findByTeacherIdOrderByCreatedAtDesc(UUID teacherId);
}
