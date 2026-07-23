package com.enterprise.studentmanagement.hr.dto;

import com.enterprise.studentmanagement.hr.entity.LearningFile;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.util.UUID;

/**
 * Tệp/đính kèm của mục học tập (dùng để hiển thị + tải).
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class LearningFileDto {
    private UUID id;
    private String fileName;
    private String contentType;
    private Long size;
    private String externalLink;
    private boolean link;

    public static LearningFileDto fromEntity(LearningFile f) {
        return LearningFileDto.builder()
                .id(f.getId())
                .fileName(f.getFileName())
                .contentType(f.getContentType())
                .size(f.getSize())
                .externalLink(f.getExternalLink())
                .link(f.getExternalLink() != null)
                .build();
    }
}
