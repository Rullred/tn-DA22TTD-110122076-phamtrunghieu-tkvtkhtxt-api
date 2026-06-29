package com.enterprise.studentmanagement.iam.util;

import jakarta.servlet.http.HttpServletRequest;

public final class RequestUtils {

    private RequestUtils() {
    }

    public static String getClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
