package com.enterprise.studentmanagement.hr.dto;

import com.enterprise.studentmanagement.hr.entity.ForumThread;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ForumThreadDto {
    private UUID id;
    private UUID classId;
    private String title;
    private String content;
    private UUID authorId;
    private String authorName;
    private String authorRole;
    private LocalDateTime createdAt;
    private Integer replyCount;
    private List<ForumReplyDto> replies;

    public static ForumThreadDto fromEntity(ForumThread t) {
        return ForumThreadDto.builder()
                .id(t.getId())
                .classId(t.getClassId())
                .title(t.getTitle())
                .content(t.getContent())
                .authorId(t.getAuthorId())
                .authorName(t.getAuthorName())
                .authorRole(t.getAuthorRole())
                .createdAt(t.getCreatedAt())
                .build();
    }
}
