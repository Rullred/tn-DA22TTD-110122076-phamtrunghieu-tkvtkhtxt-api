package com.enterprise.studentmanagement.hr.service;

import com.enterprise.studentmanagement.hr.dto.AcademicProgressDto;
import com.enterprise.studentmanagement.hr.dto.GpaDistributionDto;
import com.enterprise.studentmanagement.hr.entity.ClassEnrollment;
import com.enterprise.studentmanagement.hr.entity.CurriculumSubject;
import com.enterprise.studentmanagement.hr.entity.SchoolClass;
import com.enterprise.studentmanagement.hr.entity.Student;
import com.enterprise.studentmanagement.hr.exception.ResourceNotFoundException;
import com.enterprise.studentmanagement.hr.repository.ClassEnrollmentRepository;
import com.enterprise.studentmanagement.hr.repository.CurriculumRepository;
import com.enterprise.studentmanagement.hr.repository.SchoolClassRepository;
import com.enterprise.studentmanagement.hr.repository.StudentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Tính tiến độ học tập của sinh viên trong một học kỳ, đối chiếu chương trình khung
 * để xác định môn đã học / đang học / rớt (F) / nợ môn.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AcademicProgressService {

    private final StudentRepository studentRepository;
    private final ClassEnrollmentRepository enrollmentRepository;
    private final SchoolClassRepository classRepository;
    private final CurriculumRepository curriculumRepository;

    @Transactional(readOnly = true)
    public AcademicProgressDto getProgress(UUID studentId, String namHoc, Integer hocKy) {
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", studentId));

        String nganh = student.getMajor();

        // Môn bắt buộc theo chương trình khung của ngành + học kỳ
        List<CurriculumSubject> required = (nganh == null || hocKy == null)
                ? Collections.emptyList()
                : curriculumRepository.findByNganhAndHocKy(nganh, hocKy);

        // Toàn bộ enrollment của SV, nạp thông tin lớp để lọc theo năm học + học kỳ
        List<ClassEnrollment> allEnr = enrollmentRepository.findByStudentId(studentId);
        Set<UUID> classIds = allEnr.stream().map(ClassEnrollment::getClassId).collect(Collectors.toSet());
        Map<UUID, SchoolClass> classMap = classRepository.findAllById(classIds).stream()
                .collect(Collectors.toMap(SchoolClass::getId, c -> c));

        // Enrollment thuộc đúng năm học + học kỳ đang xét
        List<ClassEnrollment> semEnr = allEnr.stream().filter(e -> {
            SchoolClass c = classMap.get(e.getClassId());
            return c != null
                    && (namHoc == null || namHoc.equals(c.getAcademicYear()))
                    && (hocKy == null || hocKy.equals(c.getSemester()));
        }).collect(Collectors.toList());

        List<AcademicProgressDto.Item> items = new ArrayList<>();
        Set<UUID> matchedEnrIds = new HashSet<>();

        // 1) Duyệt các môn bắt buộc
        for (CurriculumSubject r : required) {
            ClassEnrollment match = semEnr.stream().filter(e -> {
                SchoolClass c = classMap.get(e.getClassId());
                if (c == null) return false;
                return equalsIgnoreCaseTrim(c.getClassCode(), r.getMaMonHoc())
                        || equalsIgnoreCaseTrim(c.getSubject(), r.getTenMonHoc());
            }).findFirst().orElse(null);

            AcademicProgressDto.Item item = AcademicProgressDto.Item.builder()
                    .maMonHoc(r.getMaMonHoc())
                    .tenMonHoc(r.getTenMonHoc())
                    .soTinChi(r.getSoTinChi())
                    .batBuoc(true)
                    .build();

            if (match == null) {
                item.setStatus("NO_MON");
            } else {
                matchedEnrIds.add(match.getId());
                applyGradeStatus(item, match);
            }
            items.add(item);
        }

        // 2) Các môn đã đăng ký nhưng KHÔNG nằm trong chương trình khung (tự chọn)
        for (ClassEnrollment e : semEnr) {
            if (matchedEnrIds.contains(e.getId())) continue;
            SchoolClass c = classMap.get(e.getClassId());
            AcademicProgressDto.Item item = AcademicProgressDto.Item.builder()
                    .maMonHoc(c != null ? c.getClassCode() : "")
                    .tenMonHoc(c != null ? (c.getSubject() != null ? c.getSubject() : c.getClassName()) : "Học phần")
                    .soTinChi(e.getCredits() != null ? e.getCredits() : 3)
                    .batBuoc(false)
                    .build();
            applyGradeStatus(item, e);
            items.add(item);
        }

        // Tổng hợp
        int tinChiDat = 0, tinChiNo = 0, soMonNo = 0, soMonRot = 0;
        double sumGpa = 0; int gpaCount = 0;
        for (AcademicProgressDto.Item it : items) {
            int tc = it.getSoTinChi() != null ? it.getSoTinChi() : 0;
            switch (it.getStatus()) {
                case "DA_HOC" -> {
                    tinChiDat += tc;
                    if (it.getDiemTongKet4() != null) { sumGpa += it.getDiemTongKet4(); gpaCount++; }
                }
                case "ROT_F" -> {
                    tinChiNo += tc; soMonRot++;
                    if (it.getDiemTongKet4() != null) { sumGpa += it.getDiemTongKet4(); gpaCount++; }
                }
                case "NO_MON" -> { tinChiNo += tc; soMonNo++; }
                default -> { /* DANG_HOC: chưa tính */ }
            }
        }

        return AcademicProgressDto.builder()
                .nganh(nganh)
                .namHoc(namHoc)
                .hocKy(hocKy)
                .items(items)
                .tinChiDat(tinChiDat)
                .tinChiNo(tinChiNo)
                .soMonNo(soMonNo)
                .soMonRot(soMonRot)
                .gpaHocKy(gpaCount > 0 ? Math.round((sumGpa / gpaCount) * 100.0) / 100.0 : null)
                .build();
    }

    /**
     * Phân bố xếp loại học lực toàn trường: mỗi SV tính GPA tích lũy (trung bình có
     * trọng số tín chỉ trên thang 4) từ tất cả môn đã có điểm, rồi xếp vào 4 nhóm.
     * SV chưa có môn nào có điểm sẽ không được tính (totalGraded phản ánh điều này).
     */
    @Transactional(readOnly = true)
    public GpaDistributionDto getGpaDistribution() {
        // studentId -> [tổng (điểm4 * tín chỉ), tổng tín chỉ]
        Map<UUID, double[]> byStudent = new HashMap<>();
        for (ClassEnrollment e : enrollmentRepository.findAll()) {
            Double g4 = e.getTotalGrade4();
            if (g4 == null) continue;
            int credits = e.getCredits() != null && e.getCredits() > 0 ? e.getCredits() : 3;
            double[] acc = byStudent.computeIfAbsent(e.getStudentId(), k -> new double[2]);
            acc[0] += g4 * credits;
            acc[1] += credits;
        }

        long excellentGood = 0, fair = 0, average = 0, weak = 0;
        for (double[] acc : byStudent.values()) {
            if (acc[1] <= 0) continue;
            double gpa = acc[0] / acc[1];
            if (gpa >= 3.2) excellentGood++;
            else if (gpa >= 2.5) fair++;
            else if (gpa >= 2.0) average++;
            else weak++;
        }

        return GpaDistributionDto.builder()
                .excellentGood(excellentGood)
                .fair(fair)
                .average(average)
                .weak(weak)
                .totalGraded(byStudent.size())
                .build();
    }

    /** Gán trạng thái môn theo điểm của enrollment. */
    private void applyGradeStatus(AcademicProgressDto.Item item, ClassEnrollment e) {
        item.setDiemChu(e.getLetterGrade());
        item.setDiemTongKet10(e.getTotalGrade10());
        item.setDiemTongKet4(e.getTotalGrade4());

        boolean isF = "F".equalsIgnoreCase(e.getLetterGrade())
                || e.getStatus() == ClassEnrollment.EnrollmentStatus.THAT_BAI;
        if (isF) {
            item.setStatus("ROT_F");
        } else if (e.getTotalGrade10() != null) {
            item.setStatus("DA_HOC");
        } else {
            item.setStatus("DANG_HOC");
        }
    }

    private boolean equalsIgnoreCaseTrim(String a, String b) {
        if (a == null || b == null) return false;
        return a.trim().equalsIgnoreCase(b.trim());
    }
}
