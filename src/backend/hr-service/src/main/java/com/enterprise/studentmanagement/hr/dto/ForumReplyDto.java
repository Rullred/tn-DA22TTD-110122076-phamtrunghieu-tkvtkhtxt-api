package com.enterprise.studentmanagement.hr.dto;

import com.enterprise.studentmanagement.hr.entity.ForumReply;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ForumReplyDto {
    private UUID id;
    private UUID threadId;
    private String content;
    private UUID authorId;
    private String authorName;
    private String authorRole;
    private LocalDateTime createdAt;

    public static ForumReplyDto fromEntity(ForumReply r) {
        return ForumReplyDto.builder()
                .id(r.getId())
                .threadId(r.getThreadId())
                .content(r.getContent())
                .authorId(r.getAuthorId())
                .authorName(r.getAuthorName())
                .authorRole(r.getAuthorRole())
                .createdAt(r.getCreatedAt())
                .build();
    }
}
