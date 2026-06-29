package com.enterprise.studentmanagement.hr.util;

import com.enterprise.studentmanagement.hr.security.EncryptionService;
import com.enterprise.studentmanagement.hr.security.HmacService;

/**
 * Key Generator Utility
 * Generates encryption and HMAC keys for configuration
 * 
 * Run this class to generate keys for production use
 */
public class KeyGenerator {

    public static void main(String[] args) {
        System.out.println("=== HR Service Key Generator ===\n");
        
        // Generate AES-256 encryption key
        String encryptionKey = EncryptionService.generateBase64Key();
        System.out.println("AES-256 Encryption Key (Base64):");
        System.out.println(encryptionKey);
        System.out.println("\nAdd to .env file:");
        System.out.println("ENCRYPTION_SECRET_KEY=" + encryptionKey);
        
        System.out.println("\n" + "=".repeat(50) + "\n");
        
        // Generate HMAC secret key
        String hmacKey = HmacService.generateBase64SecretKey();
        System.out.println("HMAC-SHA256 Secret Key (Base64):");
        System.out.println(hmacKey);
        System.out.println("\nAdd to .env file:");
        System.out.println("HMAC_SECRET_KEY=" + hmacKey);
        
        System.out.println("\n" + "=".repeat(50) + "\n");
        System.out.println("⚠️  IMPORTANT: Keep these keys secure!");
        System.out.println("⚠️  Do NOT commit these keys to version control!");
        System.out.println("⚠️  Store them in environment variables or secure vault!");
    }
}
