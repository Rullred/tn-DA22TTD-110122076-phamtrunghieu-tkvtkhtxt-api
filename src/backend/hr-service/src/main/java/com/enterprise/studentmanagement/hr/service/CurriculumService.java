package com.enterprise.studentmanagement.hr.service;

import com.enterprise.studentmanagement.hr.dto.CurriculumDto;
import com.enterprise.studentmanagement.hr.dto.CurriculumRequest;
import com.enterprise.studentmanagement.hr.entity.CurriculumSubject;
import com.enterprise.studentmanagement.hr.exception.BadRequestException;
import com.enterprise.studentmanagement.hr.exception.ResourceNotFoundException;
import com.enterprise.studentmanagement.hr.repository.CurriculumRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Service for curriculum subjects (chương trình khung) management.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CurriculumService {

    private final CurriculumRepository curriculumRepository;

    @Transactional(readOnly = true)
    public List<CurriculumDto> getAll(String nganh, Integer hocKy) {
        List<CurriculumSubject> list;
        if (nganh != null && !nganh.isBlank() && hocKy != null) {
            list = curriculumRepository.findByNganhAndHocKy(nganh, hocKy);
        } else if (nganh != null && !nganh.isBlank()) {
            list = curriculumRepository.findByNganhOrderByHocKyAscTenMonHocAsc(nganh);
        } else {
            list = curriculumRepository.findAllByOrderByNganhAscHocKyAscTenMonHocAsc();
        }
        return list.stream().map(CurriculumDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional
    public CurriculumDto create(CurriculumRequest req) {
        if (curriculumRepository.existsByNganhAndHocKyAndMaMonHoc(req.getNganh(), req.getHocKy(), req.getMaMonHoc())) {
            throw new BadRequestException("Môn học đã tồn tại trong chương trình khung của ngành/học kỳ này");
        }
        CurriculumSubject e = CurriculumSubject.builder()
                .nganh(req.getNganh())
                .hocKy(req.getHocKy())
                .maMonHoc(req.getMaMonHoc())
                .tenMonHoc(req.getTenMonHoc())
                .soTinChi(req.getSoTinChi())
                .chuyenNganh(req.getChuyenNganh())
                .monBatBuoc(req.getMonBatBuoc() != null ? req.getMonBatBuoc() : false)
                .tongTiet(req.getTongTiet())
                .lyThuyet(req.getLyThuyet())
                .thucHanh(req.getThucHanh())
                .build();
        e = curriculumRepository.save(e);
        log.info("Created curriculum subject: {} - {} (HK{}, {})", e.getMaMonHoc(), e.getTenMonHoc(), e.getHocKy(), e.getNganh());
        return CurriculumDto.fromEntity(e);
    }

    @Transactional
    public CurriculumDto update(UUID id, CurriculumRequest req) {
        CurriculumSubject e = curriculumRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("CurriculumSubject", "id", id));
        e.setNganh(req.getNganh());
        e.setHocKy(req.getHocKy());
        e.setMaMonHoc(req.getMaMonHoc());
        e.setTenMonHoc(req.getTenMonHoc());
        e.setSoTinChi(req.getSoTinChi());
        e.setChuyenNganh(req.getChuyenNganh());
        if (req.getMonBatBuoc() != null) e.setMonBatBuoc(req.getMonBatBuoc());
        e.setTongTiet(req.getTongTiet());
        e.setLyThuyet(req.getLyThuyet());
        e.setThucHanh(req.getThucHanh());
        e = curriculumRepository.save(e);
        return CurriculumDto.fromEntity(e);
    }

    @Transactional
    public void delete(UUID id) {
        if (!curriculumRepository.existsById(id)) {
            throw new ResourceNotFoundException("CurriculumSubject", "id", id);
        }
        curriculumRepository.deleteById(id);
    }
}
