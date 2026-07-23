package com.enterprise.studentmanagement.hr.util;

import com.enterprise.studentmanagement.hr.dto.QuizChoiceDto;
import com.enterprise.studentmanagement.hr.dto.QuizQuestionDto;

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Tách một khối text thành danh sách câu hỏi trắc nghiệm.
 *
 * <p>Hỗ trợ các dạng phổ biến khi giáo viên dán đề (đủ tốt — GV sẽ chỉnh lại sau):
 * <ul>
 *   <li>Câu hỏi: mở đầu bằng {@code Câu 1}, {@code 1.}, {@code 1)}, {@code Question 1} hoặc là dòng đầu block.</li>
 *   <li>Lựa chọn: mở đầu bằng {@code A. / A) / A: / A-} … (A–H), có thể gắn {@code *} để đánh dấu đáp án đúng.</li>
 *   <li>Đáp án đúng: dòng {@code Đáp án: B}, {@code ĐA: B}, {@code Answer: B}, hoặc lựa chọn gắn dấu {@code *}.</li>
 * </ul>
 * Không xác định được đáp án → đánh dấu {@code needsReview=true}, tạm chọn đáp án đầu để GV sửa.
 */
public final class QuizParser {

    private QuizParser() {}

    private static final Pattern OPTION = Pattern.compile(
            "^(\\*?)\\s*([A-Ha-h])\\s*[\\.\\)\\:\\-]\\s*(.+)$");

    // Dòng chỉ định đáp án: keyword + (dấu :.-=) + đúng MỘT chữ cái, và chữ cái phải nằm
    // ở cuối dòng (chỉ cho phép dấu/giải thích sau nó). Ràng buộc "cuối dòng" tránh việc
    // một câu hỏi dài như "Đa hình (Polymorphism) cho phép:" bị nhận nhầm là dòng đáp án.
    private static final Pattern ANSWER = Pattern.compile(
            "^\\s*(đáp\\s*án(?:\\s*đúng)?|dap\\s*an(?:\\s*dung)?|answer(?:\\s*key)?|correct(?:\\s*answer)?|key|đ\\.?a)\\s*[:\\.\\-=\\)]?\\s*([A-Ha-h])(?:\\s*[\\.\\):\\-].*)?\\s*$",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    private static final Pattern PREFIX = Pattern.compile(
            "^\\s*(?:câu|cau|question|q)?\\s*\\d+\\s*[:\\.\\)\\-]\\s*",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    private static final Pattern LOOKS_NEW = Pattern.compile(
            "^\\s*(?:câu|cau|question|q)\\s*\\d+|^\\s*\\d+\\s*[\\.\\)]",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    private static final class Node {
        String content;
        final List<String[]> choices = new ArrayList<>(); // [content, "1" nếu đánh dấu đúng]
        String answerLetter;
    }

    public static List<QuizQuestionDto> parse(String text) {
        List<QuizQuestionDto> out = new ArrayList<>();
        if (text == null || text.isBlank()) return out;

        List<Node> nodes = new ArrayList<>();
        Node current = null;

        for (String raw : text.split("\\r?\\n")) {
            String line = raw.trim();
            if (line.isEmpty()) continue;

            // Dòng chỉ định đáp án đúng
            Matcher am = ANSWER.matcher(line);
            if (am.find()) {
                if (current != null) current.answerLetter = am.group(2).toUpperCase();
                continue;
            }

            // Dòng lựa chọn
            Matcher om = OPTION.matcher(line);
            if (om.matches() && current != null) {
                boolean star = om.group(1) != null && !om.group(1).isEmpty();
                String content = om.group(3).trim();
                if (content.endsWith("*")) {
                    star = true;
                    content = content.substring(0, content.length() - 1).trim();
                }
                current.choices.add(new String[]{content, star ? "1" : "0"});
                continue;
            }

            // Dòng câu hỏi
            boolean looksNew = LOOKS_NEW.matcher(line).find();
            String stripped = PREFIX.matcher(line).replaceFirst("").trim();
            if (current != null && current.choices.isEmpty() && !looksNew) {
                // Nối tiếp phần thân câu hỏi trải trên nhiều dòng
                current.content = (current.content + " " + line).trim();
            } else {
                current = new Node();
                // Nếu dòng chỉ là nhãn "Câu N." (sau khi bỏ tiền tố còn rỗng) thì để nội dung
                // trống — phần đề ở (các) dòng sau sẽ được nối vào, tránh dính "Câu N." vào đề.
                current.content = stripped;
                nodes.add(current);
            }
        }

        int order = 0;
        for (Node n : nodes) {
            if (n.choices.isEmpty()) continue; // bỏ block rác không có lựa chọn

            int correctIdx = -1;
            for (int i = 0; i < n.choices.size(); i++) {
                if ("1".equals(n.choices.get(i)[1])) { correctIdx = i; break; }
            }
            if (correctIdx < 0 && n.answerLetter != null) {
                int idx = n.answerLetter.charAt(0) - 'A';
                if (idx >= 0 && idx < n.choices.size()) correctIdx = idx;
            }
            boolean needsReview = false;
            if (correctIdx < 0) { correctIdx = 0; needsReview = true; }

            List<QuizChoiceDto> choiceDtos = new ArrayList<>();
            for (int i = 0; i < n.choices.size(); i++) {
                choiceDtos.add(QuizChoiceDto.builder()
                        .content(n.choices.get(i)[0])
                        .correct(i == correctIdx)
                        .orderIndex(i)
                        .build());
            }

            out.add(QuizQuestionDto.builder()
                    .content(n.content)
                    .orderIndex(order++)
                    .enabled(true)
                    .needsReview(needsReview)
                    .choices(choiceDtos)
                    .build());
        }
        return out;
    }
}
