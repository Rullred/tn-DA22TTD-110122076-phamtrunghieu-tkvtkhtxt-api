package com.enterprise.studentmanagement.hr.repository;

import com.enterprise.studentmanagement.hr.entity.CurriculumSubject;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

/**
 * Repository for curriculum subjects (chương trình khung).
 */
@Repository
public interface CurriculumRepository extends JpaRepository<CurriculumSubject, UUID> {

    List<CurriculumSubject> findByNganhAndHocKy(String nganh, Integer hocKy);

    List<CurriculumSubject> findByNganhOrderByHocKyAscTenMonHocAsc(String nganh);

    List<CurriculumSubject> findAllByOrderByNganhAscHocKyAscTenMonHocAsc();

    boolean existsByNganhAndHocKyAndMaMonHoc(String nganh, Integer hocKy, String maMonHoc);
}
