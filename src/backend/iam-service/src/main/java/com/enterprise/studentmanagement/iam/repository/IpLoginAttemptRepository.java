package com.enterprise.studentmanagement.iam.repository;

import com.enterprise.studentmanagement.iam.entity.IpLoginAttempt;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IpLoginAttemptRepository extends JpaRepository<IpLoginAttempt, UUID> {
    Optional<IpLoginAttempt> findByIpAddress(String ipAddress);
}
