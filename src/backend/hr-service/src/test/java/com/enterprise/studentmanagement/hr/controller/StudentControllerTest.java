package com.enterprise.studentmanagement.hr.controller;

import com.enterprise.studentmanagement.hr.dto.CreateStudentRequest;
import com.enterprise.studentmanagement.hr.dto.PageResponse;
import com.enterprise.studentmanagement.hr.dto.StudentDto;
import com.enterprise.studentmanagement.hr.entity.Student;
import com.enterprise.studentmanagement.hr.service.StudentService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDate;
import java.util.UUID;
import java.util.Arrays;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Integration tests for StudentController
 */
@WebMvcTest(StudentController.class)
class StudentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private StudentService studentService;

    private StudentDto testStudentDto;
    private CreateStudentRequest createRequest;

    @BeforeEach
    void setUp() {
        testStudentDto = StudentDto.builder()
                                .id(UUID.fromString("00000000-0000-0000-0000-000000000001"))
                .studentCode("STU12345678")
                .firstName("John")
                .lastName("Doe")
                .email("john.doe@example.com")
                .phoneNumber("+1234567890")
                .dateOfBirth(LocalDate.of(2000, 1, 15))
                .gender("MALE")
                .address("123 Main St")
                .status("ACTIVE")
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
    }

    @Test
    void getAllStudents_ShouldReturnPagedStudents() throws Exception {
        // Arrange
        PageResponse<StudentDto> pageResponse = PageResponse.<StudentDto>builder()
                .content(Arrays.asList(testStudentDto))
                .pageNumber(0)
                .pageSize(20)
                .totalElements(1)
                .totalPages(1)
                .first(true)
                .last(true)
                .empty(false)
                .build();

        when(studentService.getAllStudents(any(Pageable.class))).thenReturn(pageResponse);

        // Act & Assert
        mockMvc.perform(get("/api/students")
                        .param("page", "0")
                        .param("size", "20"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content[0].firstName").value("John"))
                .andExpect(jsonPath("$.data.content[0].lastName").value("Doe"));

        verify(studentService, times(1)).getAllStudents(any(Pageable.class));
    }

    @Test
    void getStudentById_WhenExists_ShouldReturnStudent() throws Exception {
        // Arrange
        UUID studentId = UUID.fromString("00000000-0000-0000-0000-000000000001");
        when(studentService.getStudentById(studentId)).thenReturn(testStudentDto);

        // Act & Assert
        mockMvc.perform(get("/api/students/{id}", studentId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.firstName").value("John"))
                .andExpect(jsonPath("$.data.lastName").value("Doe"));

        verify(studentService, times(1)).getStudentById(studentId);
    }

    @Test
    void createStudent_WithValidData_ShouldCreateStudent() throws Exception {
        // Arrange
        when(studentService.createStudent(any(CreateStudentRequest.class))).thenReturn(testStudentDto);

        // Act & Assert
        mockMvc.perform(post("/api/students")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.firstName").value("John"))
                .andExpect(jsonPath("$.data.lastName").value("Doe"));

        verify(studentService, times(1)).createStudent(any(CreateStudentRequest.class));
    }

    @Test
    void createStudent_WithInvalidData_ShouldReturnBadRequest() throws Exception {
        // Arrange
        CreateStudentRequest invalidRequest = CreateStudentRequest.builder()
                .firstName("") // Invalid: empty
                .lastName("Doe")
                .email("invalid-email") // Invalid: not email format
                .build();

        // Act & Assert
        mockMvc.perform(post("/api/students")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest());

        verify(studentService, never()).createStudent(any(CreateStudentRequest.class));
    }

    @Test
    void deleteStudent_WhenExists_ShouldDeleteStudent() throws Exception {
        // Arrange
                UUID studentId = UUID.fromString("00000000-0000-0000-0000-000000000001");
                doNothing().when(studentService).deleteStudent(studentId);

        // Act & Assert
                mockMvc.perform(delete("/api/students/{id}", studentId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

                verify(studentService, times(1)).deleteStudent(studentId);
    }

    @Test
    void countAllStudents_ShouldReturnCount() throws Exception {
        // Arrange
        when(studentService.countAllStudents()).thenReturn(10L);

        // Act & Assert
        mockMvc.perform(get("/api/students/count"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data").value(10));

        verify(studentService, times(1)).countAllStudents();
    }
}
