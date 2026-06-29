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
import java.util.List;
import java.util.UUID;
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
        
        // Generate unique class code
        String classCode = generateClassCode();
        
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
        
        // Check if already enrolled
        if (enrollmentRepository.existsByClassIdAndStudentId(classId, request.getStudentId())) {
            throw new BadRequestException("Student is already enrolled in this class");
        }
        
        // Create enrollment
        ClassEnrollment enrollment = ClassEnrollment.builder()
                .classId(classId)
                .studentId(request.getStudentId())
                .enrollmentDate(LocalDateTime.now())
                .status(ClassEnrollment.EnrollmentStatus.DA_DANG_KY)
                .notes(request.getNotes())
                .build();
        
        enrollment = enrollmentRepository.save(enrollment);
        
        // Update class current students count
        schoolClass.setCurrentStudents(schoolClass.getCurrentStudents() + 1);
        classRepository.save(schoolClass);
        
        log.info("Student enrolled successfully: student={}, class={}", request.getStudentId(), classId);
        
        return convertToEnrollmentDto(enrollment, student, schoolClass);
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
