package com.enterprise.studentmanagement.iam.repository;

import com.enterprise.studentmanagement.iam.entity.IpBlacklist;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface IpBlacklistRepository extends JpaRepository<IpBlacklist, UUID> {
    boolean existsByIpAddress(String ipAddress);

    Optional<IpBlacklist> findByIpAddress(String ipAddress);

    void deleteByIpAddress(String ipAddress);
}
