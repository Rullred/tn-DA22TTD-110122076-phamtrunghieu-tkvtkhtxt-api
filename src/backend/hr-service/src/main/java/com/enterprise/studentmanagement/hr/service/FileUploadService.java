package com.enterprise.studentmanagement.hr.service;

import com.enterprise.studentmanagement.hr.exception.BadRequestException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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
}
