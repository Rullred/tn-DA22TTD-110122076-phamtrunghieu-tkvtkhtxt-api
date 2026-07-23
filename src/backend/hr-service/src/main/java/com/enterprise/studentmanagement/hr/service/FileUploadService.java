package com.enterprise.studentmanagement.hr.service;

import com.enterprise.studentmanagement.hr.exception.BadRequestException;
import com.enterprise.studentmanagement.hr.exception.ResourceNotFoundException;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

/**
 * File Upload Service
 * Handles file uploads for avatars and documents
 */
@Slf4j
@Service
public class FileUploadService {

    @Value("${file.upload.directory:uploads}")
    private String uploadDirectory;

    @Value("${file.upload.max-size:5242880}") // 5MB default
    private long maxFileSize;

    private static final List<String> ALLOWED_IMAGE_TYPES = Arrays.asList(
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    );

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
            ".jpg", ".jpeg", ".png", ".gif", ".webp"
    );

    /**
     * Upload avatar image
     */
    public String uploadAvatar(MultipartFile file, String entityType, UUID entityId) {
        log.info("Uploading avatar for {} with ID: {}", entityType, entityId);

        // Validate file
        validateFile(file);

        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String filename = String.format("%s_%s_%s%s", 
                entityType.toLowerCase(), 
                entityId, 
                UUID.randomUUID().toString().substring(0, 8), 
                extension);

        // Create upload directory if not exists
        Path uploadPath = Paths.get(uploadDirectory, "avatars");
        try {
            Files.createDirectories(uploadPath);
        } catch (IOException e) {
            log.error("Failed to create upload directory", e);
            throw new BadRequestException("Failed to create upload directory");
        }

        // Save file
        Path filePath = uploadPath.resolve(filename);
        try {
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            log.info("Avatar uploaded successfully: {}", filename);
        } catch (IOException e) {
            log.error("Failed to save file", e);
            throw new BadRequestException("Failed to save file");
        }

        // Return URL path
        return "/uploads/avatars/" + filename;
    }

    /**
     * Delete avatar file
     */
    public void deleteAvatar(String avatarUrl) {
        if (avatarUrl == null || avatarUrl.isEmpty()) {
            return;
        }

        log.info("Deleting avatar: {}", avatarUrl);

        // Extract filename from URL
        String filename = avatarUrl.substring(avatarUrl.lastIndexOf('/') + 1);
        Path filePath = Paths.get(uploadDirectory, "avatars", filename);

        try {
            Files.deleteIfExists(filePath);
            log.info("Avatar deleted successfully: {}", filename);
        } catch (IOException e) {
            log.error("Failed to delete file", e);
            // Don't throw exception, just log the error
        }
    }

    /**
     * Validate uploaded file
     */
    private void validateFile(MultipartFile file) {
        // Check if file is empty
        if (file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }

        // Check file size
        if (file.getSize() > maxFileSize) {
            throw new BadRequestException(
                    String.format("File size exceeds maximum allowed size of %d bytes", maxFileSize));
        }

        // Check content type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_IMAGE_TYPES.contains(contentType.toLowerCase())) {
            throw new BadRequestException(
                    "Invalid file type. Allowed types: " + String.join(", ", ALLOWED_IMAGE_TYPES));
        }

        // Check file extension
        String filename = file.getOriginalFilename();
        if (filename == null || !hasAllowedExtension(filename)) {
            throw new BadRequestException(
                    "Invalid file extension. Allowed extensions: " + String.join(", ", ALLOWED_EXTENSIONS));
        }
    }

    /**
     * Check if filename has allowed extension
     */
    private boolean hasAllowedExtension(String filename) {
        String lowerFilename = filename.toLowerCase();
        return ALLOWED_EXTENSIONS.stream().anyMatch(lowerFilename::endsWith);
    }

    /**
     * Get file extension from filename
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }

    /**
     * Get upload directory path
     */
    public String getUploadDirectory() {
        return uploadDirectory;
    }

    // ------------------------------------------------------------- Tài liệu học tập

    @Value("${file.upload.doc-max-size:26214400}") // 25MB
    private long docMaxSize;

    private static final List<String> ALLOWED_DOC_EXT = Arrays.asList(
            ".pdf", ".doc", ".docx", ".ppt", ".pptx", ".xls", ".xlsx",
            ".zip", ".txt", ".png", ".jpg", ".jpeg", ".gif", ".webp"
    );

    /**
     * Upload một tài liệu / bài nộp. Cho phép PDF/Office/zip/ảnh, tối đa 25MB.
     * Lưu vào {uploads}/{subDir}/{uuid}_{tên-an-toàn}; trả metadata để lưu DB.
     */
    public StoredFile uploadDocument(MultipartFile file, String subDir) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File trống");
        }
        if (file.getSize() > docMaxSize) {
            throw new BadRequestException("File vượt quá dung lượng cho phép (tối đa 25MB)");
        }
        String original = file.getOriginalFilename() == null ? "file" : file.getOriginalFilename();
        String ext = getFileExtension(original).toLowerCase();
        if (!ALLOWED_DOC_EXT.contains(ext)) {
            throw new BadRequestException("Loại file không được phép: " + (ext.isEmpty() ? "(không rõ)" : ext)
                    + ". Cho phép: " + String.join(", ", ALLOWED_DOC_EXT));
        }

        String safe = original.replaceAll("[^a-zA-Z0-9._-]", "_");
        if (safe.length() > 120) safe = safe.substring(safe.length() - 120);
        String stored = UUID.randomUUID().toString().substring(0, 8) + "_" + safe;

        Path dir = Paths.get(uploadDirectory, subDir);
        try {
            Files.createDirectories(dir);
            Files.copy(file.getInputStream(), dir.resolve(stored), StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException e) {
            log.error("Failed to save document", e);
            throw new BadRequestException("Lưu file thất bại");
        }
        String rel = subDir + "/" + stored;
        log.info("Uploaded document: {} ({} bytes)", rel, file.getSize());
        return new StoredFile(rel, original, file.getContentType(), file.getSize());
    }

    /** Nạp file để stream về client. */
    public Resource loadAsResource(String storagePath) {
        Path p = Paths.get(uploadDirectory).resolve(storagePath).normalize();
        Resource resource = new FileSystemResource(p);
        if (!resource.exists() || !resource.isReadable()) {
            throw new ResourceNotFoundException("File not found: " + storagePath);
        }
        return resource;
    }

    /** Xóa file trên đĩa (bỏ qua nếu không có). */
    public void deleteDocument(String storagePath) {
        if (storagePath == null || storagePath.isBlank()) return;
        try {
            Files.deleteIfExists(Paths.get(uploadDirectory).resolve(storagePath).normalize());
        } catch (IOException e) {
            log.error("Failed to delete document {}", storagePath, e);
        }
    }

    /** Metadata trả về sau khi lưu file. */
    @Getter
    public static class StoredFile {
        private final String storagePath;
        private final String fileName;
        private final String contentType;
        private final long size;

        public StoredFile(String storagePath, String fileName, String contentType, long size) {
            this.storagePath = storagePath;
            this.fileName = fileName;
            this.contentType = contentType;
            this.size = size;
        }
    }
}
