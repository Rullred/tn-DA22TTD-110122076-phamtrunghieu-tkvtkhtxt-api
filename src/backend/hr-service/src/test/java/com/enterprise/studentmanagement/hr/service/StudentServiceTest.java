package com.enterprise.studentmanagement.hr.service;

import com.enterprise.studentmanagement.hr.dto.CreateStudentRequest;
import com.enterprise.studentmanagement.hr.dto.StudentDto;
import com.enterprise.studentmanagement.hr.dto.UpdateStudentRequest;
import com.enterprise.studentmanagement.hr.entity.Student;
import com.enterprise.studentmanagement.hr.exception.BadRequestException;
import com.enterprise.studentmanagement.hr.exception.ResourceNotFoundException;
import com.enterprise.studentmanagement.hr.repository.StudentRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.UUID;
import java.util.Arrays;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

/**
 * Unit tests for StudentService
 */
@ExtendWith(MockitoExtension.class)
class StudentServiceTest {

    @Mock
    private StudentRepository studentRepository;

    @InjectMocks
    private StudentService studentService;

    private Student testStudent;
    private CreateStudentRequest createRequest;
    private UpdateStudentRequest updateRequest;

    @BeforeEach
    void setUp() {
        testStudent = Student.builder()
                .id(UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .studentCode("STU12345678")
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .phoneNumber("+1234567890")
                .dateOfBirth(LocalDate.of(2000, 1, 15))
                .gender(Student.Gender.NAM)
                .address("123 Main St")
                .status(Student.StudentStatus.HOAT_DONG)
                .enrollmentDate(LocalDate.of(2024, 9, 1))
                .build();

        createRequest = CreateStudentRequest.builder()
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .phoneNumber("+1234567890")
                .dateOfBirth(LocalDate.of(2000, 1, 15))
                .gender(Student.Gender.NAM)
                .address("123 Main St")
                .enrollmentDate(LocalDate.of(2024, 9, 1))
                .build();

        updateRequest = UpdateStudentRequest.builder()
                .firstName("Jane")
                .lastName("Smith")
                .build();
    }

    @Test
    void getAllStudents_ShouldReturnPagedStudents() {
        // Arrange
        Pageable pageable = PageRequest.of(0, 10);
        Page<Student> studentPage = new PageImpl<>(Arrays.asList(testStudent));
        when(studentRepository.findAll(pageable)).thenReturn(studentPage);

        // Act
        var result = studentService.getAllStudents(pageable);

        // Assert
        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("John", result.getContent().get(0).getFirstName());
        verify(studentRepository, times(1)).findAll(pageable);
    }

    @Test
    void getStudentById_WhenExists_ShouldReturnStudent() {
        // Arrange
        UUID studentId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        when(studentRepository.findById(studentId)).thenReturn(Optional.of(testStudent));

        // Act
        StudentDto result = studentService.getStudentById(studentId);

        // Assert
        assertNotNull(result);
        assertEquals("John", result.getFirstName());
        assertEquals("Doe", result.getLastName());
        verify(studentRepository, times(1)).findById(studentId);
    }

    @Test
    void getStudentById_WhenNotExists_ShouldThrowException() {
        // Arrange
        UUID studentId = UUID.fromString("00000000-0000-0000-0000-000000000999");
        when(studentRepository.findById(studentId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            studentService.getStudentById(studentId);
        });
        verify(studentRepository, times(1)).findById(studentId);
    }

    @Test
    void createStudent_WithValidData_ShouldCreateStudent() {
        // Arrange
        when(studentRepository.existsByEmail(createRequest.getEmail())).thenReturn(false);
        when(studentRepository.existsByStudentCode(anyString())).thenReturn(false);
        when(studentRepository.save(any(Student.class))).thenReturn(testStudent);

        // Act
        StudentDto result = studentService.createStudent(createRequest);

        // Assert
        assertNotNull(result);
        assertEquals("John", result.getFirstName());
        assertEquals("Doe", result.getLastName());
        verify(studentRepository, times(1)).existsByEmail(createRequest.getEmail());
        verify(studentRepository, times(1)).save(any(Student.class));
    }

    @Test
    void createStudent_WithDuplicateEmail_ShouldThrowException() {
        // Arrange
        when(studentRepository.existsByEmail(createRequest.getEmail())).thenReturn(true);

        // Act & Assert
        assertThrows(BadRequestException.class, () -> {
            studentService.createStudent(createRequest);
        });
        verify(studentRepository, times(1)).existsByEmail(createRequest.getEmail());
        verify(studentRepository, never()).save(any(Student.class));
    }

    @Test
    void updateStudent_WithValidData_ShouldUpdateStudent() {
        // Arrange
        UUID studentId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        when(studentRepository.findById(studentId)).thenReturn(Optional.of(testStudent));
        when(studentRepository.save(any(Student.class))).thenReturn(testStudent);

        // Act
        StudentDto result = studentService.updateStudent(studentId, updateRequest);

        // Assert
        assertNotNull(result);
        verify(studentRepository, times(1)).findById(studentId);
        verify(studentRepository, times(1)).save(any(Student.class));
    }

    @Test
    void updateStudent_WhenNotExists_ShouldThrowException() {
        // Arrange
        UUID studentId = UUID.fromString("00000000-0000-0000-0000-000000000999");
        when(studentRepository.findById(studentId)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            studentService.updateStudent(studentId, updateRequest);
        });
        verify(studentRepository, times(1)).findById(studentId);
        verify(studentRepository, never()).save(any(Student.class));
    }

    @Test
    void deleteStudent_WhenExists_ShouldDeleteStudent() {
        // Arrange
        UUID studentId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        when(studentRepository.existsById(studentId)).thenReturn(true);
        doNothing().when(studentRepository).deleteById(studentId);

        // Act
        studentService.deleteStudent(studentId);

        // Assert
        verify(studentRepository, times(1)).existsById(studentId);
        verify(studentRepository, times(1)).deleteById(studentId);
    }

    @Test
    void deleteStudent_WhenNotExists_ShouldThrowException() {
        // Arrange
        UUID studentId = UUID.fromString("00000000-0000-0000-0000-000000000999");
        when(studentRepository.existsById(studentId)).thenReturn(false);

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            studentService.deleteStudent(studentId);
        });
        verify(studentRepository, times(1)).existsById(studentId);
        verify(studentRepository, never()).deleteById(any(UUID.class));
    }

    @Test
    void countAllStudents_ShouldReturnCount() {
        // Arrange
        when(studentRepository.count()).thenReturn(10L);

        // Act
        long result = studentService.countAllStudents();

        // Assert
        assertEquals(10L, result);
        verify(studentRepository, times(1)).count();
    }

    @Test
    void countStudentsByStatus_ShouldReturnCount() {
        // Arrange
        when(studentRepository.countByStatus(Student.StudentStatus.HOAT_DONG)).thenReturn(5L);

        // Act
        long result = studentService.countStudentsByStatus(Student.StudentStatus.HOAT_DONG);

        // Assert
        assertEquals(5L, result);
        verify(studentRepository, times(1)).countByStatus(Student.StudentStatus.HOAT_DONG);
    }
}
