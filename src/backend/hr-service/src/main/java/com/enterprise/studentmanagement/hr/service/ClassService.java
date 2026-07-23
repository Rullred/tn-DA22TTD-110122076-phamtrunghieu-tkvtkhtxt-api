package com.enterprise.studentmanagement.hr.service;

import com.enterprise.studentmanagement.hr.dto.*;
import com.enterprise.studentmanagement.hr.entity.ClassEnrollment;
import com.enterprise.studentmanagement.hr.entity.SchoolClass;
import com.enterprise.studentmanagement.hr.entity.Student;
import com.enterprise.studentmanagement.hr.entity.Teacher;
import com.enterprise.studentmanagement.hr.exception.BadRequestException;
import com.enterprise.studentmanagement.hr.exception.ResourceNotFoundException;
import com.enterprise.studentmanagement.hr.repository.ClassEnrollmentRepository;
import com.enterprise.studentmanagement.hr.repository.SchoolClassRepository;
import com.enterprise.studentmanagement.hr.repository.StudentRepository;
import com.enterprise.studentmanagement.hr.repository.TeacherRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Class Service
 * Business logic for class and enrollment management
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ClassService {

    private final SchoolClassRepository classRepository;
    private final ClassEnrollmentRepository enrollmentRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;

    /**
     * Get all classes with pagination
     */
    @Transactional(readOnly = true)
    public PageResponse<ClassDto> getAllClasses(Pageable pageable) {
        log.info("Fetching all classes, page: {}, size: {}", pageable.getPageNumber(), pageable.getPageSize());
        
        Page<SchoolClass> classPage = classRepository.findAll(pageable);
        Page<ClassDto> dtoPage = classPage.map(this::convertToDto);
        
        return PageResponse.fromPage(dtoPage);
    }

    /**
     * Get class by ID
     */
    @Transactional(readOnly = true)
    public ClassDto getClassById(UUID id) {
        log.info("Fetching class by ID: {}", id);
        
        SchoolClass schoolClass = classRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Class", "id", id));
        
        return convertToDto(schoolClass);
    }

    /**
     * Get class by class code
     */
    @Transactional(readOnly = true)
    public ClassDto getClassByCode(String classCode) {
        log.info("Fetching class by code: {}", classCode);
        
        SchoolClass schoolClass = classRepository.findByClassCode(classCode)
                .orElseThrow(() -> new ResourceNotFoundException("Class", "classCode", classCode));
        
        return convertToDto(schoolClass);
    }

    /**
     * Get classes by teacher
     */
    @Transactional(readOnly = true)
    public PageResponse<ClassDto> getClassesByTeacher(UUID teacherId, Pageable pageable) {
        log.info("Fetching classes by teacher: {}", teacherId);
        
        Page<SchoolClass> classPage = classRepository.findByTeacherId(teacherId, pageable);
        Page<ClassDto> dtoPage = classPage.map(this::convertToDto);
        
        return PageResponse.fromPage(dtoPage);
    }

    /**
     * Get classes by status
     */
    @Transactional(readOnly = true)
    public PageResponse<ClassDto> getClassesByStatus(SchoolClass.ClassStatus status, Pageable pageable) {
        log.info("Fetching classes by status: {}", status);
        
        Page<SchoolClass> classPage = classRepository.findByStatus(status, pageable);
        Page<ClassDto> dtoPage = classPage.map(this::convertToDto);
        
        return PageResponse.fromPage(dtoPage);
    }

    /**
     * Search classes by name
     */
    @Transactional(readOnly = true)
    public PageResponse<ClassDto> searchClassesByName(String name, Pageable pageable) {
        log.info("Searching classes by name: {}", name);
        
        Page<SchoolClass> classPage = classRepository.searchByName(name, pageable);
        Page<ClassDto> dtoPage = classPage.map(this::convertToDto);
        
        return PageResponse.fromPage(dtoPage);
    }

    /**
     * Create a new class
     */
    @Transactional
    public ClassDto createClass(CreateClassRequest request) {
        log.info("Creating new class: {}", request.getClassName());
        
        // Validate teacher exists
        Teacher teacher = teacherRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new ResourceNotFoundException("Teacher", "id", request.getTeacherId()));
        
        // Validate teacher is active
        if (teacher.getStatus() != Teacher.TeacherStatus.HOAT_DONG) {
            throw new BadRequestException("Teacher is not active");
        }
        
        // Validate dates
        if (request.getEndDate().isBefore(request.getStartDate())) {
            throw new BadRequestException("End date must be after start date");
        }
        
        // Dùng mã lớp do người tạo đặt nếu có (kiểm tra trùng), ngược lại tự sinh.
        String classCode;
        if (request.getClassCode() != null && !request.getClassCode().isBlank()) {
            classCode = request.getClassCode().trim();
            if (classRepository.existsByClassCode(classCode)) {
                throw new BadRequestException("Mã lớp '" + classCode + "' đã tồn tại, vui lòng đổi mã khác.");
            }
        } else {
            classCode = generateClassCode();
        }

        // Create class entity
        SchoolClass schoolClass = SchoolClass.builder()
                .classCode(classCode)
                .className(request.getClassName())
                .description(request.getDescription())
                .teacherId(request.getTeacherId())
                .subject(request.getSubject())
                .room(request.getRoom())
                .maxStudents(request.getMaxStudents())
                .currentStudents(0)
                .schedule(request.getSchedule())
                .status(SchoolClass.ClassStatus.HOAT_DONG)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .academicYear(request.getAcademicYear())
                .semester(request.getSemester())
                .build();
        
        schoolClass = classRepository.save(schoolClass);
        
        log.info("Class created successfully with ID: {} and code: {}", schoolClass.getId(), schoolClass.getClassCode());
        
        return convertToDto(schoolClass);
    }

    /**
     * Update class
     */
    @Transactional
    public ClassDto updateClass(UUID id, UpdateClassRequest request) {
        log.info("Updating class with ID: {}", id);
        
        SchoolClass schoolClass = classRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Class", "id", id));
        
        // Validate teacher if changed
        if (request.getTeacherId() != null && !request.getTeacherId().equals(schoolClass.getTeacherId())) {
            Teacher teacher = teacherRepository.findById(request.getTeacherId())
                    .orElseThrow(() -> new ResourceNotFoundException("Teacher", "id", request.getTeacherId()));
            
            if (teacher.getStatus() != Teacher.TeacherStatus.HOAT_DONG) {
                throw new BadRequestException("Teacher is not active");
            }
        }
        
        // Validate dates if changed
        LocalDateTime startDate = request.getStartDate() != null ? request.getStartDate().atStartOfDay() : 
                                  schoolClass.getStartDate().atStartOfDay();
        LocalDateTime endDate = request.getEndDate() != null ? request.getEndDate().atStartOfDay() : 
                                schoolClass.getEndDate().atStartOfDay();
        
        if (endDate.isBefore(startDate)) {
            throw new BadRequestException("End date must be after start date");
        }
        
        // Validate max students if changed
        if (request.getMaxStudents() != null && request.getMaxStudents() < schoolClass.getCurrentStudents()) {
            throw new BadRequestException("Cannot reduce max students below current enrollment count");
        }
        
        // Update fields
        if (request.getClassName() != null) {
            schoolClass.setClassName(request.getClassName());
        }
        if (request.getDescription() != null) {
            schoolClass.setDescription(request.getDescription());
        }
        if (request.getTeacherId() != null) {
            schoolClass.setTeacherId(request.getTeacherId());
        }
        if (request.getSubject() != null) {
            schoolClass.setSubject(request.getSubject());
        }
        if (request.getRoom() != null) {
            schoolClass.setRoom(request.getRoom());
        }
        if (request.getMaxStudents() != null) {
            schoolClass.setMaxStudents(request.getMaxStudents());
        }
         if (request.getSchedule() != null) {
            schoolClass.setSchedule(request.getSchedule());
        }
        if (request.getStatus() != null) {
            schoolClass.setStatus(request.getStatus());
        }
        if (request.getStartDate() != null) {
            schoolClass.setStartDate(request.getStartDate());
        }
        if (request.getEndDate() != null) {
            schoolClass.setEndDate(request.getEndDate());
        }
        if (request.getAcademicYear() != null) {
            schoolClass.setAcademicYear(request.getAcademicYear());
        }
        if (request.getSemester() != null) {
            schoolClass.setSemester(request.getSemester());
        }
        
        schoolClass = classRepository.save(schoolClass);
        
        log.info("Class updated successfully: {}", id);
        
        return convertToDto(schoolClass);
    }

    /**
     * Delete class
     */
    @Transactional
    public void deleteClass(UUID id) {
        log.info("Deleting class with ID: {}", id);
        
        SchoolClass schoolClass = classRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Class", "id", id));
        
        // Check if class has active enrollments
        long activeEnrollments = enrollmentRepository.countByClassIdAndStatus(id, ClassEnrollment.EnrollmentStatus.DA_DANG_KY);
        if (activeEnrollments > 0) {
            throw new BadRequestException("Cannot delete class with active enrollments");
        }
        
        classRepository.deleteById(id);
        
        log.info("Class deleted successfully: {}", schoolClass.getId());
    }

    /**
     * Enroll student in class
     */
    @Transactional
    public EnrollmentDto enrollStudent(UUID classId, EnrollStudentRequest request) {
        log.info("Enrolling student {} in class {}", request.getStudentId(), classId);
        
        // Validate class exists
        SchoolClass schoolClass = classRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class", "id", classId));
        
        // Validate class is active
        if (schoolClass.getStatus() != SchoolClass.ClassStatus.HOAT_DONG) {
            throw new BadRequestException("Class is not active");
        }
        
        // Validate class is not full
        if (schoolClass.getCurrentStudents() >= schoolClass.getMaxStudents()) {
            throw new BadRequestException("Class is full");
        }
        
        // Validate student exists
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new ResourceNotFoundException("Student", "id", request.getStudentId()));
        
        // Validate student is active
        if (student.getStatus() != Student.StudentStatus.HOAT_DONG) {
            throw new BadRequestException("Student is not active");
        }

        // Kiểm tra TRÙNG LỊCH với các lớp sinh viên đang đăng ký (DA_DANG_KY).
        // Không cho đăng ký nếu thời gian học chồng chéo với một lớp đã đăng ký khác.
        if (schoolClass.getSchedule() != null && !schoolClass.getSchedule().isBlank()) {
            List<ClassEnrollment> activeEnrollments = enrollmentRepository
                    .findByStudentIdAndStatus(request.getStudentId(), ClassEnrollment.EnrollmentStatus.DA_DANG_KY);
            for (ClassEnrollment active : activeEnrollments) {
                if (active.getClassId().equals(classId)) {
                    continue; // bỏ qua chính lớp này (trường hợp đăng ký lại lớp đã bỏ)
                }
                SchoolClass other = classRepository.findById(active.getClassId()).orElse(null);
                if (other == null || other.getSchedule() == null || other.getSchedule().isBlank()) {
                    continue;
                }
                if (schedulesConflict(schoolClass.getSchedule(), other.getSchedule())) {
                    String otherName = other.getSubject() != null && !other.getSubject().isBlank()
                            ? other.getSubject() : other.getClassName();
                    throw new BadRequestException(String.format(
                            "Trùng lịch học với lớp \"%s\" (%s). Vui lòng chọn lớp khác.",
                            otherName, other.getSchedule().trim()));
                }
            }
        }

        // Nếu đã có bản ghi đăng ký cho lớp này:
        //  - Đang học (DA_DANG_KY) hoặc đã có kết quả (DA_HOAN_THANH/THAT_BAI) -> không cho đăng ký trùng.
        //  - Đã bỏ học (DA_BO_HOC) -> tái kích hoạt chính bản ghi đó (đăng ký lại lớp đã bỏ).
        ClassEnrollment enrollment = enrollmentRepository
                .findByClassIdAndStudentId(classId, request.getStudentId())
                .orElse(null);

        if (enrollment != null) {
            if (enrollment.getStatus() != ClassEnrollment.EnrollmentStatus.DA_BO_HOC) {
                throw new BadRequestException("Student is already enrolled in this class");
            }
            // Đăng ký lại lớp đã bỏ trước đó
            enrollment.setStatus(ClassEnrollment.EnrollmentStatus.DA_DANG_KY);
            enrollment.setDroppedAt(null);
            enrollment.setEnrollmentDate(LocalDateTime.now());
            enrollment.setNotes(request.getNotes());
        } else {
            // Tạo bản ghi đăng ký mới
            enrollment = ClassEnrollment.builder()
                    .classId(classId)
                    .studentId(request.getStudentId())
                    .enrollmentDate(LocalDateTime.now())
                    .status(ClassEnrollment.EnrollmentStatus.DA_DANG_KY)
                    .notes(request.getNotes())
                    .build();
        }

        enrollment = enrollmentRepository.save(enrollment);
        
        // Update class current students count
        schoolClass.setCurrentStudents(schoolClass.getCurrentStudents() + 1);
        classRepository.save(schoolClass);
        
        log.info("Student enrolled successfully: student={}, class={}", request.getStudentId(), classId);
        
        return convertToEnrollmentDto(enrollment, student, schoolClass);
    }

    // ==================== KIỂM TRA TRÙNG LỊCH HỌC ====================

    // "Thứ 2", "thứ 3"..."thứ 7" -> nhóm 1 là số; "chủ nhật"/"cn" -> Chủ nhật.
    private static final Pattern DAY_PATTERN =
            Pattern.compile("th[uứ]\\s*([2-7])|ch[uủ]\\s*nh[aậ]t|\\bcn\\b");
    // "7h", "7h30", "13h30" ... dạng "<giờ>h<phút?> - <giờ>h<phút?>"
    private static final Pattern TIME_RANGE_PATTERN =
            Pattern.compile("(\\d{1,2})h(\\d{1,2})?\\s*[-–]\\s*(\\d{1,2})h(\\d{1,2})?");

    /** Một ca học: thứ trong tuần (2..7, 8 = Chủ nhật) + phút bắt đầu/kết thúc trong ngày. */
    private record ScheduleSlot(int day, int startMinute, int endMinute) {}

    /**
     * Parse chuỗi lịch học tự do (vd "Thứ 2, 7h-9h30; Thứ 4, 13h30-16h") thành danh sách ca học.
     * Mỗi đoạn ngăn cách bởi ';' hoặc '|' là một ca. Đoạn không nhận dạng được sẽ bị bỏ qua
     * (an toàn: không parse được -> không coi là trùng, tránh chặn nhầm).
     */
    private List<ScheduleSlot> parseScheduleSlots(String schedule) {
        List<ScheduleSlot> slots = new ArrayList<>();
        if (schedule == null || schedule.isBlank()) return slots;
        for (String part : schedule.toLowerCase().split("[;|]")) {
            String p = part.trim();
            if (p.isEmpty()) continue;

            Matcher dm = DAY_PATTERN.matcher(p);
            if (!dm.find()) continue;
            int day = dm.group(1) != null ? Integer.parseInt(dm.group(1)) : 8; // 8 = Chủ nhật

            Matcher tm = TIME_RANGE_PATTERN.matcher(p);
            if (!tm.find()) continue;
            int startMinute = Integer.parseInt(tm.group(1)) * 60
                    + (tm.group(2) != null && !tm.group(2).isEmpty() ? Integer.parseInt(tm.group(2)) : 0);
            int endMinute = Integer.parseInt(tm.group(3)) * 60
                    + (tm.group(4) != null && !tm.group(4).isEmpty() ? Integer.parseInt(tm.group(4)) : 0);
            if (endMinute <= startMinute) continue; // giờ không hợp lệ -> bỏ qua

            slots.add(new ScheduleSlot(day, startMinute, endMinute));
        }
        return slots;
    }

    /** Hai lịch học có trùng nhau không: có ca cùng thứ và khoảng thời gian giao nhau. */
    private boolean schedulesConflict(String scheduleA, String scheduleB) {
        List<ScheduleSlot> a = parseScheduleSlots(scheduleA);
        List<ScheduleSlot> b = parseScheduleSlots(scheduleB);
        for (ScheduleSlot x : a) {
            for (ScheduleSlot y : b) {
                if (x.day() == y.day()
                        && x.startMinute() < y.endMinute()
                        && y.startMinute() < x.endMinute()) {
                    return true;
                }
            }
        }
        return false;
    }

    /**
     * Update enrollment
     */
    @Transactional
    public EnrollmentDto updateEnrollment(UUID enrollmentId, UpdateEnrollmentRequest request) {
        log.info("Updating enrollment: {}", enrollmentId);
        
        ClassEnrollment enrollment = enrollmentRepository.findById(enrollmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment", "id", enrollmentId));
        
        // Update fields
        if (request.getStatus() != null) {
            enrollment.setStatus(request.getStatus());
            
            // Set dropped date if status is DROPPED
            if (request.getStatus() == ClassEnrollment.EnrollmentStatus.DA_BO_HOC && enrollment.getDroppedAt() == null) {
                enrollment.setDroppedAt(LocalDateTime.now());
            }
        }
        
        // Update detailed grading fields
        if (request.getCredits() != null) {
            enrollment.setCredits(request.getCredits());
        }
        if (request.getComponentGrade1() != null) {
            enrollment.setComponentGrade1(request.getComponentGrade1());
        }
        if (request.getComponentGrade2() != null) {
            enrollment.setComponentGrade2(request.getComponentGrade2());
        }
        if (request.getFinalExamGrade() != null) {
            enrollment.setFinalExamGrade(request.getFinalExamGrade());
        }
        
        // Auto-calculate total grades if all component grades are present
        if (enrollment.getComponentGrade1() != null && 
            enrollment.getComponentGrade2() != null && 
            enrollment.getFinalExamGrade() != null) {
            
            Double totalGrade10 = com.enterprise.studentmanagement.hr.util.GradeCalculator.calculateTotalGrade10(
                enrollment.getComponentGrade1(),
                enrollment.getComponentGrade2(),
                enrollment.getFinalExamGrade()
            );
            enrollment.setTotalGrade10(totalGrade10);
            enrollment.setTotalGrade4(com.enterprise.studentmanagement.hr.util.GradeCalculator.convertTo4Scale(totalGrade10));
            enrollment.setLetterGrade(com.enterprise.studentmanagement.hr.util.GradeCalculator.convertToLetterGrade(totalGrade10));
        }
        
        // Legacy fields for backward compatibility
        if (request.getGrade() != null) {
            enrollment.setGrade(request.getGrade());
        }
        if (request.getAttendanceRate() != null) {
            enrollment.setAttendanceRate(request.getAttendanceRate());
        }
        if (request.getNotes() != null) {
            enrollment.setNotes(request.getNotes());
        }
        
        enrollment = enrollmentRepository.save(enrollment);
        
        log.info("Enrollment updated successfully: {}", enrollmentId);
        
        // Load related entities for DTO
        Student student = studentRepository.findById(enrollment.getStudentId()).orElse(null);
        SchoolClass schoolClass = classRepository.findById(enrollment.getClassId()).orElse(null);
        
        return convertToEnrollmentDto(enrollment, student, schoolClass);
    }

    /**
     * Chốt học kỳ cho một lớp học phần.
     * Mọi sinh viên đã đăng ký (DA_DANG_KY) mà CHƯA được chấm điểm (totalGrade10 == null)
     * sẽ bị điểm F (rớt môn) theo quy tắc: đăng ký nhưng không được chấm = trượt.
     * Sinh viên đã có điểm được đánh dấu hoàn thành. Lớp chuyển sang DA_HOAN_THANH.
     *
     * @return số sinh viên bị điểm F sau khi chốt
     */
    @Transactional
    public int finalizeClass(UUID classId) {
        log.info("Finalizing class: {}", classId);

        SchoolClass schoolClass = classRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class", "id", classId));

        List<ClassEnrollment> active = enrollmentRepository.findByClassIdAndStatus(
                classId, ClassEnrollment.EnrollmentStatus.DA_DANG_KY);

        int failedCount = 0;
        for (ClassEnrollment e : active) {
            if (e.getTotalGrade10() == null) {
                // Đã đăng ký nhưng không được chấm -> rớt F
                e.setTotalGrade10(0.0);
                e.setTotalGrade4(0.0);
                e.setLetterGrade("F");
                e.setStatus(ClassEnrollment.EnrollmentStatus.THAT_BAI);
                failedCount++;
            } else {
                // Đã có điểm -> đánh dấu hoàn thành
                e.setStatus(ClassEnrollment.EnrollmentStatus.DA_HOAN_THANH);
            }
            enrollmentRepository.save(e);
        }

        schoolClass.setStatus(SchoolClass.ClassStatus.DA_HOAN_THANH);
        classRepository.save(schoolClass);

        log.info("Finalized class {}: {} students marked F (ungraded)", classId, failedCount);
        return failedCount;
    }

    /**
     * Drop student from class
     */
    @Transactional
    public void dropStudent(UUID classId, UUID studentId) {
        log.info("Dropping student {} from class {}", studentId, classId);
        
        ClassEnrollment enrollment = enrollmentRepository.findByClassIdAndStudentId(classId, studentId)
                .orElseThrow(() -> new ResourceNotFoundException("Enrollment not found"));
        
        if (enrollment.getStatus() != ClassEnrollment.EnrollmentStatus.DA_DANG_KY) {
            throw new BadRequestException("Student is not currently enrolled");
        }
        
        enrollment.setStatus(ClassEnrollment.EnrollmentStatus.DA_BO_HOC);
        enrollment.setDroppedAt(LocalDateTime.now());
        enrollmentRepository.save(enrollment);
        
        // Update class current students count
        SchoolClass schoolClass = classRepository.findById(classId)
                .orElseThrow(() -> new ResourceNotFoundException("Class", "id", classId));
        schoolClass.setCurrentStudents(Math.max(0, schoolClass.getCurrentStudents() - 1));
        classRepository.save(schoolClass);
        
        log.info("Student dropped successfully: student={}, class={}", studentId, classId);
    }

    /**
     * Get enrollments for a class
     */
    @Transactional(readOnly = true)
    public PageResponse<EnrollmentDto> getClassEnrollments(UUID classId, Pageable pageable) {
        log.info("Fetching enrollments for class: {}", classId);
        
        Page<ClassEnrollment> enrollmentPage = enrollmentRepository.findByClassId(classId, pageable);
        Page<EnrollmentDto> dtoPage = enrollmentPage.map(enrollment -> {
            Student student = studentRepository.findById(enrollment.getStudentId()).orElse(null);
            SchoolClass schoolClass = classRepository.findById(enrollment.getClassId()).orElse(null);
            return convertToEnrollmentDto(enrollment, student, schoolClass);
        });
        
        return PageResponse.fromPage(dtoPage);
    }

    /**
     * Get enrollments for a student
     */
    @Transactional(readOnly = true)
    public PageResponse<EnrollmentDto> getStudentEnrollments(UUID studentId, Pageable pageable) {
        log.info("Fetching enrollments for student: {}", studentId);
        
        Page<ClassEnrollment> enrollmentPage = enrollmentRepository.findByStudentId(studentId, pageable);
        Page<EnrollmentDto> dtoPage = enrollmentPage.map(enrollment -> {
            Student student = studentRepository.findById(enrollment.getStudentId()).orElse(null);
            SchoolClass schoolClass = classRepository.findById(enrollment.getClassId()).orElse(null);
            return convertToEnrollmentDto(enrollment, student, schoolClass);
        });
        
        return PageResponse.fromPage(dtoPage);
    }

    /**
     * Get active students in a class
     */
    @Transactional(readOnly = true)
    public List<StudentDto> getActiveStudentsInClass(UUID classId) {
        log.info("Fetching active students in class: {}", classId);
        
        List<ClassEnrollment> enrollments = enrollmentRepository.findActiveEnrollmentsByClassId(classId);
        
        return enrollments.stream()
                .map(enrollment -> studentRepository.findById(enrollment.getStudentId()).orElse(null))
                .filter(student -> student != null)
                .map(StudentDto::fromEntity)
                .collect(Collectors.toList());
    }

    /**
     * Generate unique class code
     */
    private String generateClassCode() {
        String code;
        do {
            code = "CLS" + UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (classRepository.existsByClassCode(code));
        return code;
    }

    /**
     * Convert SchoolClass to ClassDto with teacher name
     */
    private ClassDto convertToDto(SchoolClass schoolClass) {
        ClassDto dto = ClassDto.fromEntity(schoolClass);
        
        // Load teacher name
        if (schoolClass.getTeacherId() != null) {
            teacherRepository.findById(schoolClass.getTeacherId())
                    .ifPresent(teacher -> dto.setTeacherName(teacher.getLastName() + " " + teacher.getFirstName()));
        }
        
        return dto;
    }

    /**
     * Convert ClassEnrollment to EnrollmentDto with names
     */
    private EnrollmentDto convertToEnrollmentDto(ClassEnrollment enrollment, Student student, SchoolClass schoolClass) {
        EnrollmentDto dto = EnrollmentDto.fromEntity(enrollment);
        
        if (student != null) {
            dto.setStudentName(student.getLastName() + " " + student.getFirstName());
            dto.setStudentCode(student.getStudentCode());
        }
        
        if (schoolClass != null) {
            dto.setClassName(schoolClass.getClassName());
        }
        
        return dto;
    }

    /**
     * Count classes by status
     */
    @Transactional(readOnly = true)
    public long countClassesByStatus(SchoolClass.ClassStatus status) {
        return classRepository.countByStatus(status);
    }

    /**
     * Count all classes
     */
    @Transactional(readOnly = true)
    public long countAllClasses() {
        return classRepository.count();
    }

    /**
     * Get available classes for student registration
     */
    @Transactional(readOnly = true)
    public PageResponse<AvailableClassDto> getAvailableClasses(
            UUID studentId, String academicYear, Integer semester, Pageable pageable) {
        
        log.info("Getting available classes for student: {}, year: {}, semester: {}", 
                 studentId, academicYear, semester);
        
        // Get all active classes
        Page<SchoolClass> classPage;
        
        if (academicYear != null && semester != null) {
            classPage = classRepository.findByAcademicYearAndSemesterAndStatus(
                academicYear, semester, SchoolClass.ClassStatus.HOAT_DONG, pageable);
        } else if (academicYear != null) {
            classPage = classRepository.findByAcademicYearAndStatus(
                academicYear, SchoolClass.ClassStatus.HOAT_DONG, pageable);
        } else {
            classPage = classRepository.findByStatus(SchoolClass.ClassStatus.HOAT_DONG, pageable);
        }
        
        // Convert to AvailableClassDto
        Page<AvailableClassDto> dtoPage = classPage.map(cls -> {
            Teacher teacher = cls.getTeacherId() != null 
                ? teacherRepository.findById(cls.getTeacherId()).orElse(null)
                : null;
            
            boolean isEnrolled = false;
            if (studentId != null) {
                isEnrolled = enrollmentRepository.existsByClassIdAndStudentIdAndStatus(
                    cls.getId(), studentId, ClassEnrollment.EnrollmentStatus.DA_DANG_KY);
            }
            
            int availableSlots = cls.getMaxStudents() != null && cls.getCurrentStudents() != null
                ? cls.getMaxStudents() - cls.getCurrentStudents()
                : 0;
            
            return AvailableClassDto.builder()
                    .id(cls.getId())
                    .classCode(cls.getClassCode())
                    .className(cls.getClassName())
                    .subject(cls.getSubject())
                    .academicYear(cls.getAcademicYear())
                    .semester(cls.getSemester())
                    .teacherName(teacher != null ? teacher.getFullName() : null)
                    .schedule(cls.getSchedule())
                    .room(cls.getRoom())
                    .maxStudents(cls.getMaxStudents())
                    .currentStudents(cls.getCurrentStudents())
                    .availableSlots(availableSlots)
                    .status(cls.getStatus().name())
                    .isEnrolled(isEnrolled)
                    .build();
        });
        
        return PageResponse.fromPage(dtoPage);
    }
}
