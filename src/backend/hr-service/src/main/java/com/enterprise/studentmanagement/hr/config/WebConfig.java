package com.enterprise.studentmanagement.hr.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Web Configuration
 * Configures static resource handling
 */
@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${file.upload.directory:uploads}")
    private String uploadDirectory;

    /**
     * Configure static resource handlers for uploaded files
     */
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:" + uploadDirectory + "/");
    }
}
