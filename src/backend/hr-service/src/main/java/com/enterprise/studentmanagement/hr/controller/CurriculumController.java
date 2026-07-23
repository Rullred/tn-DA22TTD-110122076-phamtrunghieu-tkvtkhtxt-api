package com.enterprise.studentmanagement.hr.controller;

import com.enterprise.studentmanagement.hr.dto.ApiResponse;
import com.enterprise.studentmanagement.hr.dto.CurriculumDto;
import com.enterprise.studentmanagement.hr.dto.CurriculumRequest;
import com.enterprise.studentmanagement.hr.service.CurriculumService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for curriculum (chương trình khung) management.
 */
@Slf4j
@RestController
@RequestMapping("/api/curriculum")
@RequiredArgsConstructor
public class CurriculumController {

    private final CurriculumService curriculumService;

    /**
     * List curriculum subjects, optionally filtered by ngành and/or học kỳ.
     * GET /api/curriculum?nganh=&hocKy=
     */
    @GetMapping
    public ResponseEntity<ApiResponse<List<CurriculumDto>>> getAll(
            @RequestParam(required = false) String nganh,
            @RequestParam(required = false) Integer hocKy) {

        List<CurriculumDto> list = curriculumService.getAll(nganh, hocKy);
        return ResponseEntity.ok(ApiResponse.success(list, "Curriculum retrieved successfully"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<CurriculumDto>> create(@Valid @RequestBody CurriculumRequest request) {
        CurriculumDto dto = curriculumService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(dto, "Curriculum subject created"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<CurriculumDto>> update(
            @PathVariable UUID id,
            @Valid @RequestBody CurriculumRequest request) {
        CurriculumDto dto = curriculumService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(dto, "Curriculum subject updated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable UUID id) {
        curriculumService.delete(id);
        return ResponseEntity.ok(ApiResponse.success("Curriculum subject deleted"));
    }
}
