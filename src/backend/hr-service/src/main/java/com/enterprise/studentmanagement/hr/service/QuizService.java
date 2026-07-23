package com.enterprise.studentmanagement.hr.service;

import com.enterprise.studentmanagement.hr.dto.*;
import com.enterprise.studentmanagement.hr.entity.*;
import com.enterprise.studentmanagement.hr.exception.BadRequestException;
import com.enterprise.studentmanagement.hr.exception.ResourceNotFoundException;
import com.enterprise.studentmanagement.hr.repository.*;
import com.enterprise.studentmanagement.hr.util.QuizParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Business logic cho trắc nghiệm online: tạo bài, tách câu hỏi từ text, bốc đề ngẫu nhiên,
 * chấm bài, tổng hợp điểm cao nhất và xuất về điểm quá trình (componentGrade1) của lớp.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizQuestionRepository questionRepository;
    private final QuizChoiceRepository choiceRepository;
    private final QuizAttemptRepository attemptRepository;
    private final ClassEnrollmentRepository enrollmentRepository;
    private final SchoolClassRepository classRepository;
    private final StudentRepository studentRepository;
    private final ClassService classService;

    // ----------------------------------------------------------------- Quiz CRUD

    @Transactional
    public QuizDto createQuiz(CreateQuizRequest req) {
        if (!classRepository.existsById(req.getClassId())) {
            throw new ResourceNotFoundException("Class", "id", req.getClassId());
        }
        Quiz quiz = Quiz.builder()
                .classId(req.getClassId())
                .teacherId(req.getTeacherId())
                .title(req.getTitle())
                .description(req.getDescription())
                .questionsPerAttempt(req.getQuestionsPerAttempt())
                .timeLimitMinutes(req.getTimeLimitMinutes())
                .maxScore(req.getMaxScore() != null ? req.getMaxScore() : 10.0)
                .status(Quiz.QuizStatus.NHAP)
                .build();
        quiz = quizRepository.save(quiz);
        log.info("Created quiz {} for class {}", quiz.getId(), quiz.getClassId());
        return withCounts(QuizDto.fromEntity(quiz));
    }

    @Transactional
    public QuizDto updateQuiz(UUID quizId, UpdateQuizRequest req) {
        Quiz quiz = getQuizOrThrow(quizId);
        if (req.getTitle() != null) quiz.setTitle(req.getTitle());
        if (req.getDescription() != null) quiz.setDescription(req.getDescription());
        if (req.getQuestionsPerAttempt() != null) quiz.setQuestionsPerAttempt(req.getQuestionsPerAttempt());
        if (req.getTimeLimitMinutes() != null) quiz.setTimeLimitMinutes(req.getTimeLimitMinutes());
        if (req.getMaxScore() != null) quiz.setMaxScore(req.getMaxScore());
        if (req.getStatus() != null) {
            try {
                quiz.setStatus(Quiz.QuizStatus.valueOf(req.getStatus()));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Trạng thái không hợp lệ: " + req.getStatus());
            }
        }
        quiz = quizRepository.save(quiz);
        return withCounts(QuizDto.fromEntity(quiz));
    }

    @Transactional
    public void deleteQuiz(UUID quizId) {
        Quiz quiz = getQuizOrThrow(quizId);
        // FK ON DELETE CASCADE dọn câu hỏi / lựa chọn / bài làm ở tầng DB.
        quizRepository.delete(quiz);
    }

    @Transactional(readOnly = true)
    public List<QuizDto> listByClass(UUID classId) {
        return quizRepository.findByClassIdOrderByCreatedAtDesc(classId).stream()
                .map(q -> withCounts(QuizDto.fromEntity(q)))
                .collect(Collectors.toList());
    }

    /** Chi tiết bài kèm câu hỏi. includeAnswers=true cho GV (thấy đáp án đúng). */
    @Transactional(readOnly = true)
    public QuizDto getQuiz(UUID quizId, boolean includeAnswers) {
        Quiz quiz = getQuizOrThrow(quizId);
        QuizDto dto = withCounts(QuizDto.fromEntity(quiz));
        List<QuizQuestion> questions = questionRepository.findByQuizIdOrderByOrderIndexAsc(quizId);
        dto.setQuestions(questions.stream()
                .map(q -> toQuestionDto(q, includeAnswers, false))
                .collect(Collectors.toList()));
        return dto;
    }

    // ------------------------------------------------------------- Question editing

    /** Tách text thành câu hỏi. replace=true thay toàn bộ câu hỏi hiện có. */
    @Transactional
    public QuizDto parseAndReplaceQuestions(UUID quizId, ParseQuestionsRequest req) {
        getQuizOrThrow(quizId); // xác thực tồn tại
        List<QuizQuestionDto> parsed = QuizParser.parse(req.getText());
        if (parsed.isEmpty()) {
            throw new BadRequestException("Không tách được câu hỏi nào từ nội dung đã dán.");
        }
        if (req.isReplace()) {
            deleteAllQuestions(quizId);
        }
        int base = req.isReplace() ? 0
                : (int) questionRepository.findByQuizIdOrderByOrderIndexAsc(quizId).size();
        int order = base;
        for (QuizQuestionDto pq : parsed) {
            saveQuestion(quizId, pq.getContent(), true, order++, pq.getChoices());
        }
        return getQuiz(quizId, true);
    }

    @Transactional
    public QuizQuestionDto addQuestion(UUID quizId, UpsertQuestionRequest req) {
        getQuizOrThrow(quizId);
        int order = questionRepository.findByQuizIdOrderByOrderIndexAsc(quizId).size();
        List<QuizChoiceDto> choices = toChoiceDtos(req.getChoices());
        QuizQuestion saved = saveQuestion(quizId, req.getContent(),
                req.getEnabled() == null || req.getEnabled(), order, choices);
        return toQuestionDto(saved, true, false);
    }

    @Transactional
    public QuizQuestionDto updateQuestion(UUID questionId, UpsertQuestionRequest req) {
        QuizQuestion q = questionRepository.findById(questionId)
                .orElseThrow(() -> new ResourceNotFoundException("Question", "id", questionId));
        q.setContent(req.getContent());
        if (req.getEnabled() != null) q.setEnabled(req.getEnabled());
        questionRepository.save(q);
        // Thay toàn bộ lựa chọn
        choiceRepository.deleteByQuestionId(questionId);
        saveChoices(questionId, toChoiceDtos(req.getChoices()));
        return toQuestionDto(q, true, false);
    }

    @Transactional
    public void deleteQuestion(UUID questionId) {
        if (!questionRepository.existsById(questionId)) {
            throw new ResourceNotFoundException("Question", "id", questionId);
        }
        // Lựa chọn được dọn bởi FK CASCADE.
        questionRepository.deleteById(questionId);
    }

    // ---------------------------------------------------------------- Student side

    /** Bài đã xuất bản thuộc các lớp SV đang đăng ký, kèm điểm cao nhất + số lần làm. */
    @Transactional(readOnly = true)
    public List<StudentQuizDto> getStudentQuizzes(UUID studentId) {
        List<UUID> classIds = enrollmentRepository.findActiveEnrollmentsByStudentId(studentId).stream()
                .map(ClassEnrollment::getClassId)
                .distinct()
                .collect(Collectors.toList());
        if (classIds.isEmpty()) return List.of();

        List<Quiz> quizzes = quizRepository.findByClassIdInAndStatus(classIds, Quiz.QuizStatus.DA_XUAT_BAN);
        List<StudentQuizDto> out = new ArrayList<>();
        for (Quiz quiz : quizzes) {
            long enabled = questionRepository.countByQuizIdAndEnabledTrue(quiz.getId());
            List<QuizAttempt> attempts = submittedAttempts(quiz.getId(), studentId);
            Double best = attempts.stream().map(QuizAttempt::getScore)
                    .filter(Objects::nonNull).max(Double::compareTo).orElse(null);
            String className = classRepository.findById(quiz.getClassId())
                    .map(SchoolClass::getClassName).orElse(null);
            int effectiveN = effectiveQuestionCount(quiz.getQuestionsPerAttempt(), (int) enabled);
            out.add(StudentQuizDto.builder()
                    .quizId(quiz.getId())
                    .classId(quiz.getClassId())
                    .className(className)
                    .title(quiz.getTitle())
                    .description(quiz.getDescription())
                    .questionsPerAttempt(effectiveN)
                    .enabledQuestions((int) enabled)
                    .timeLimitMinutes(quiz.getTimeLimitMinutes())
                    .maxScore(quiz.getMaxScore())
                    .bestScore(best)
                    .attemptCount(attempts.size())
                    .build());
        }
        return out;
    }

    /** Bắt đầu một lượt làm: bốc N câu ngẫu nhiên, xáo lựa chọn, KHÔNG kèm đáp án. */
    @Transactional
    public StartAttemptResponse startAttempt(UUID quizId, UUID studentId) {
        Quiz quiz = getQuizOrThrow(quizId);
        if (quiz.getStatus() != Quiz.QuizStatus.DA_XUAT_BAN) {
            throw new BadRequestException("Bài trắc nghiệm chưa mở để làm.");
        }
        List<QuizQuestion> enabled = new ArrayList<>(questionRepository.findByQuizIdAndEnabledTrue(quizId));
        if (enabled.isEmpty()) {
            throw new BadRequestException("Bài trắc nghiệm chưa có câu hỏi.");
        }
        Collections.shuffle(enabled);
        int n = effectiveQuestionCount(quiz.getQuestionsPerAttempt(), enabled.size());
        List<QuizQuestion> drawn = enabled.subList(0, n);

        QuizAttempt attempt = attemptRepository.save(QuizAttempt.builder()
                .quizId(quizId)
                .studentId(studentId)
                .questionCount(n)
                .status(QuizAttempt.AttemptStatus.DANG_LAM)
                .startedAt(LocalDateTime.now())
                .build());

        List<QuizQuestionDto> qdtos = new ArrayList<>();
        int order = 0;
        for (QuizQuestion q : drawn) {
            List<QuizChoice> choices = new ArrayList<>(
                    choiceRepository.findByQuestionIdOrderByOrderIndexAsc(q.getId()));
            Collections.shuffle(choices);
            List<QuizChoiceDto> cdtos = new ArrayList<>();
            int co = 0;
            for (QuizChoice c : choices) {
                cdtos.add(QuizChoiceDto.builder()
                        .id(c.getId())
                        .content(c.getContent())
                        .orderIndex(co++)
                        .build()); // không set correct
            }
            qdtos.add(QuizQuestionDto.builder()
                    .id(q.getId())
                    .content(q.getContent())
                    .orderIndex(order++)
                    .choices(cdtos)
                    .build());
        }

        return StartAttemptResponse.builder()
                .attemptId(attempt.getId())
                .quizId(quizId)
                .title(quiz.getTitle())
                .timeLimitMinutes(quiz.getTimeLimitMinutes())
                .maxScore(quiz.getMaxScore())
                .questionCount(n)
                .questions(qdtos)
                .build();
    }

    /** Nộp bài: chấm từ payload, lưu điểm, trả điểm lượt này + điểm cao nhất. */
    @Transactional
    public AttemptResultDto submitAttempt(UUID attemptId, SubmitAttemptRequest req) {
        QuizAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new ResourceNotFoundException("Attempt", "id", attemptId));
        if (attempt.getStatus() == QuizAttempt.AttemptStatus.DA_NOP) {
            throw new BadRequestException("Bài làm này đã được nộp.");
        }
        Quiz quiz = getQuizOrThrow(attempt.getQuizId());
        double max = quiz.getMaxScore() != null ? quiz.getMaxScore() : 10.0;
        int qCount = attempt.getQuestionCount() != null && attempt.getQuestionCount() > 0
                ? attempt.getQuestionCount()
                : (req.getAnswers() != null ? req.getAnswers().size() : 0);

        int correct = 0;
        if (req.getAnswers() != null) {
            for (SubmitAttemptRequest.AnswerInput a : req.getAnswers()) {
                if (a.getChoiceId() == null) continue;
                QuizChoice c = choiceRepository.findById(a.getChoiceId()).orElse(null);
                if (c != null && Boolean.TRUE.equals(c.getCorrect())
                        && (a.getQuestionId() == null || c.getQuestionId().equals(a.getQuestionId()))) {
                    correct++;
                }
            }
        }
        if (correct > qCount) correct = qCount;
        double score = qCount > 0 ? round2((double) correct / qCount * max) : 0.0;

        attempt.setCorrectCount(correct);
        attempt.setScore(score);
        attempt.setStatus(QuizAttempt.AttemptStatus.DA_NOP);
        attempt.setSubmittedAt(LocalDateTime.now());
        attemptRepository.save(attempt);

        Double best = submittedAttempts(quiz.getId(), attempt.getStudentId()).stream()
                .map(QuizAttempt::getScore).filter(Objects::nonNull)
                .max(Double::compareTo).orElse(score);

        return AttemptResultDto.builder()
                .attemptId(attempt.getId())
                .score(score)
                .correctCount(correct)
                .questionCount(qCount)
                .maxScore(max)
                .bestScore(best)
                .build();
    }

    @Transactional(readOnly = true)
    public List<AttemptResultDto> getStudentAttempts(UUID quizId, UUID studentId) {
        Quiz quiz = getQuizOrThrow(quizId);
        double max = quiz.getMaxScore() != null ? quiz.getMaxScore() : 10.0;
        return submittedAttempts(quizId, studentId).stream()
                .sorted(Comparator.comparing(QuizAttempt::getSubmittedAt,
                        Comparator.nullsLast(Comparator.naturalOrder())))
                .map(a -> AttemptResultDto.builder()
                        .attemptId(a.getId())
                        .score(a.getScore())
                        .correctCount(a.getCorrectCount())
                        .questionCount(a.getQuestionCount())
                        .maxScore(max)
                        .build())
                .collect(Collectors.toList());
    }

    // ---------------------------------------------------------------- Teacher results

    /** Bảng điểm: mỗi SV có bài nộp -> điểm cao nhất + số lần làm. */
    @Transactional(readOnly = true)
    public List<QuizResultRowDto> getResults(UUID quizId) {
        getQuizOrThrow(quizId);
        Map<UUID, List<QuizAttempt>> byStudent = attemptRepository
                .findByQuizIdAndStatus(quizId, QuizAttempt.AttemptStatus.DA_NOP).stream()
                .collect(Collectors.groupingBy(QuizAttempt::getStudentId));

        List<QuizResultRowDto> rows = new ArrayList<>();
        for (Map.Entry<UUID, List<QuizAttempt>> e : byStudent.entrySet()) {
            Double best = e.getValue().stream().map(QuizAttempt::getScore)
                    .filter(Objects::nonNull).max(Double::compareTo).orElse(null);
            Student s = studentRepository.findById(e.getKey()).orElse(null);
            rows.add(QuizResultRowDto.builder()
                    .studentId(e.getKey())
                    .studentName(s != null ? (s.getLastName() + " " + s.getFirstName()) : null)
                    .studentCode(s != null ? s.getStudentCode() : null)
                    .attemptCount(e.getValue().size())
                    .bestScore(best)
                    .build());
        }
        rows.sort(Comparator.comparing(QuizResultRowDto::getStudentCode,
                Comparator.nullsLast(Comparator.naturalOrder())));
        return rows;
    }

    /**
     * Xuất điểm cao nhất của mỗi SV vào Điểm thành phần 1 (điểm quá trình) của lớp học phần.
     * Tái sử dụng ClassService.updateEnrollment để tính lại tổng kết nhất quán.
     * @return số sinh viên đã ghi điểm
     */
    @Transactional
    public int exportGrades(UUID quizId) {
        Quiz quiz = getQuizOrThrow(quizId);
        UUID classId = quiz.getClassId();
        Map<UUID, List<QuizAttempt>> byStudent = attemptRepository
                .findByQuizIdAndStatus(quizId, QuizAttempt.AttemptStatus.DA_NOP).stream()
                .collect(Collectors.groupingBy(QuizAttempt::getStudentId));

        int count = 0;
        for (Map.Entry<UUID, List<QuizAttempt>> e : byStudent.entrySet()) {
            Double best = e.getValue().stream().map(QuizAttempt::getScore)
                    .filter(Objects::nonNull).max(Double::compareTo).orElse(null);
            if (best == null) continue;
            Optional<ClassEnrollment> enr = enrollmentRepository.findByClassIdAndStudentId(classId, e.getKey());
            if (enr.isEmpty()) continue;
            classService.updateEnrollment(enr.get().getId(),
                    UpdateEnrollmentRequest.builder().componentGrade1(best).build());
            count++;
        }
        log.info("Exported quiz {} grades to componentGrade1 for {} students", quizId, count);
        return count;
    }

    // ---------------------------------------------------------------------- helpers

    private Quiz getQuizOrThrow(UUID quizId) {
        return quizRepository.findById(quizId)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz", "id", quizId));
    }

    private QuizDto withCounts(QuizDto dto) {
        List<QuizQuestion> qs = questionRepository.findByQuizIdOrderByOrderIndexAsc(dto.getId());
        dto.setTotalQuestions(qs.size());
        dto.setEnabledQuestions((int) qs.stream().filter(q -> Boolean.TRUE.equals(q.getEnabled())).count());
        classRepository.findById(dto.getClassId()).ifPresent(c -> dto.setClassName(c.getClassName()));
        return dto;
    }

    private List<QuizAttempt> submittedAttempts(UUID quizId, UUID studentId) {
        return attemptRepository.findByQuizIdAndStudentId(quizId, studentId).stream()
                .filter(a -> a.getStatus() == QuizAttempt.AttemptStatus.DA_NOP)
                .collect(Collectors.toList());
    }

    private int effectiveQuestionCount(Integer configured, int available) {
        if (configured == null || configured <= 0 || configured > available) return available;
        return configured;
    }

    private QuizQuestionDto toQuestionDto(QuizQuestion q, boolean includeAnswers, boolean shuffleChoices) {
        List<QuizChoice> choices = new ArrayList<>(
                choiceRepository.findByQuestionIdOrderByOrderIndexAsc(q.getId()));
        if (shuffleChoices) Collections.shuffle(choices);
        List<QuizChoiceDto> cdtos = new ArrayList<>();
        int order = 0;
        for (QuizChoice c : choices) {
            cdtos.add(QuizChoiceDto.builder()
                    .id(c.getId())
                    .content(c.getContent())
                    .correct(includeAnswers ? c.getCorrect() : null)
                    .orderIndex(order++)
                    .build());
        }
        return QuizQuestionDto.builder()
                .id(q.getId())
                .content(q.getContent())
                .orderIndex(q.getOrderIndex())
                .enabled(q.getEnabled())
                .choices(cdtos)
                .build();
    }

    private List<QuizChoiceDto> toChoiceDtos(List<UpsertQuestionRequest.ChoiceInput> inputs) {
        List<QuizChoiceDto> dtos = new ArrayList<>();
        if (inputs == null) return dtos;
        int order = 0;
        for (UpsertQuestionRequest.ChoiceInput ci : inputs) {
            dtos.add(QuizChoiceDto.builder()
                    .content(ci.getContent())
                    .correct(ci.getCorrect() != null && ci.getCorrect())
                    .orderIndex(order++)
                    .build());
        }
        return dtos;
    }

    private QuizQuestion saveQuestion(UUID quizId, String content, boolean enabled, int order,
                                      List<QuizChoiceDto> choices) {
        QuizQuestion q = questionRepository.save(QuizQuestion.builder()
                .quizId(quizId)
                .content(content)
                .orderIndex(order)
                .enabled(enabled)
                .build());
        saveChoices(q.getId(), choices);
        return q;
    }

    private void saveChoices(UUID questionId, List<QuizChoiceDto> choices) {
        if (choices == null) return;
        int order = 0;
        for (QuizChoiceDto c : choices) {
            choiceRepository.save(QuizChoice.builder()
                    .questionId(questionId)
                    .content(c.getContent())
                    .correct(c.getCorrect() != null && c.getCorrect())
                    .orderIndex(order++)
                    .build());
        }
    }

    private void deleteAllQuestions(UUID quizId) {
        List<QuizQuestion> existing = questionRepository.findByQuizIdOrderByOrderIndexAsc(quizId);
        List<UUID> ids = existing.stream().map(QuizQuestion::getId).collect(Collectors.toList());
        if (!ids.isEmpty()) {
            choiceRepository.deleteByQuestionIdIn(ids);
            questionRepository.deleteAll(existing);
        }
    }

    private static double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
