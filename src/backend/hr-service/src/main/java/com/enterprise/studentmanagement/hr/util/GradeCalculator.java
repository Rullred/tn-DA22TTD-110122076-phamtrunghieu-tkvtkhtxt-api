package com.enterprise.studentmanagement.hr.util;

/**
 * Utility class for grade calculations
 * Calculates total grades and letter grades based on Vietnamese education system
 */
public class GradeCalculator {

    // Grade weights (typical Vietnamese university system)
    private static final double COMPONENT1_WEIGHT = 0.2;  // 20%
    private static final double COMPONENT2_WEIGHT = 0.3;  // 30%
    private static final double FINAL_EXAM_WEIGHT = 0.5;  // 50%

    /**
     * Calculate total grade on scale of 10
     * Formula: (ĐTK L1 * 0.2) + (ĐTK L2 * 0.3) + (T3 * 0.5)
     */
    public static Double calculateTotalGrade10(Double comp1, Double comp2, Double finalExam) {
        if (comp1 == null || comp2 == null || finalExam == null) {
            return null;
        }
        
        double total = (comp1 * COMPONENT1_WEIGHT) 
                     + (comp2 * COMPONENT2_WEIGHT) 
                     + (finalExam * FINAL_EXAM_WEIGHT);
        
        return Math.round(total * 100.0) / 100.0; // Round to 2 decimal places
    }

    /**
     * Convert grade from scale 10 to scale 4 (GPA)
     */
    public static Double convertTo4Scale(Double grade10) {
        if (grade10 == null) {
            return null;
        }
        
        if (grade10 >= 8.5) return 4.0;
        if (grade10 >= 8.0) return 3.5;
        if (grade10 >= 7.0) return 3.0;
        if (grade10 >= 6.5) return 2.5;
        if (grade10 >= 5.5) return 2.0;
        if (grade10 >= 5.0) return 1.5;
        if (grade10 >= 4.0) return 1.0;
        return 0.0;
    }

    /**
     * Convert grade to letter grade
     */
    public static String convertToLetterGrade(Double grade10) {
        if (grade10 == null) {
            return null;
        }
        
        if (grade10 >= 9.0) return "A";
        if (grade10 >= 8.5) return "B+";
        if (grade10 >= 8.0) return "B";
        if (grade10 >= 7.0) return "C+";
        if (grade10 >= 6.5) return "C";
        if (grade10 >= 5.5) return "D+";
        if (grade10 >= 5.0) return "D";
        return "F";
    }

    /**
     * Check if student passed the course
     */
    public static boolean isPassed(Double grade10) {
        return grade10 != null && grade10 >= 5.0;
    }

    /**
     * Calculate GPA from list of grades
     */
    public static Double calculateGPA(Double... grades4) {
        if (grades4 == null || grades4.length == 0) {
            return 0.0;
        }
        
        double sum = 0.0;
        int count = 0;
        
        for (Double grade : grades4) {
            if (grade != null) {
                sum += grade;
                count++;
            }
        }
        
        if (count == 0) {
            return 0.0;
        }
        
        return Math.round((sum / count) * 100.0) / 100.0;
    }
}
