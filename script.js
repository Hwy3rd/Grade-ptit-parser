// Biến trạng thái toàn cục
let questionsData = []; // Toàn bộ câu hỏi đã tải
let currentQuestions = []; // Câu hỏi đang được dùng làm bài (đã shuffle)
let displayMode = 'single'; // 'single' hoặc 'list'
let currentIndex = 0; // Chỉ số câu hiện tại (chế độ single)
let userAnswers = {}; // Lưu đáp án người dùng chọn: { questionId: answerLetter }
let uploadedQuestions = null; // Lưu trữ câu hỏi custom được upload qua file
let startTime = null;
let timerInterval = null;

// DOM Elements
const configScreen = document.getElementById('config-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');

const questionSourceSelect = document.getElementById('question-source');
const fileUploadInput = document.getElementById('file-upload');
const fileNameDisplay = document.getElementById('file-name-display');
const startBtn = document.getElementById('start-btn');

const quizProgressText = document.getElementById('quiz-progress-text');
const quizTimer = document.getElementById('quiz-timer');
const progressFill = document.getElementById('progress-fill');
const questionsContainer = document.getElementById('questions-container');

const finishEarlyBtn = document.getElementById('finish-early-btn');
const nextQuestionBtn = document.getElementById('next-question-btn');
const submitListBtn = document.getElementById('submit-list-btn');

const scorePercentage = document.getElementById('score-percentage');
const scoreFraction = document.getElementById('score-fraction');
const correctCountText = document.getElementById('correct-count');
const wrongCountText = document.getElementById('wrong-count');
const unansweredCountText = document.getElementById('unanswered-count');
const wrongQuestionsSection = document.getElementById('wrong-questions-section');
const wrongQuestionsList = document.getElementById('wrong-questions-list');
const restartBtn = document.getElementById('restart-btn');

// --- Khởi tạo và Lắng nghe sự kiện ---
document.addEventListener('DOMContentLoaded', () => {
  // Lắng nghe tải file lên
  fileUploadInput.addEventListener('change', handleFileUpload);
  
  // Bắt đầu làm bài
  startBtn.addEventListener('click', startQuiz);

  // Kết thúc sớm
  finishEarlyBtn.addEventListener('click', () => {
    if (confirm('Bạn có chắc chắn muốn kết thúc bài thi sớm không?')) {
      finishQuiz();
    }
  });

  // Chuyển câu (Chế độ Câu đơn)
  nextQuestionBtn.addEventListener('click', goToNextQuestion);

  // Nộp bài (Chế độ Danh sách)
  submitListBtn.addEventListener('click', () => {
    if (confirm('Bạn có chắc chắn muốn nộp bài?')) {
      finishQuiz();
    }
  });

  // Làm lại
  restartBtn.addEventListener('click', resetApp);
});

// --- Xử lý tải file lên ---
function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;
  
  fileNameDisplay.textContent = `Đang đọc file: ${file.name}`;
  
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const parsed = JSON.parse(evt.target.result);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].question && parsed[0].answers) {
        uploadedQuestions = parsed;
        fileNameDisplay.textContent = `Đã tải lên thành công: ${file.name} (${parsed.length} câu)`;
        fileNameDisplay.style.color = '#10b981';
      } else {
        throw new Error('Sai cấu trúc tệp câu hỏi trắc nghiệm');
      }
    } catch (err) {
      alert('Tệp tải lên không hợp lệ hoặc sai cấu trúc JSON.');
      fileNameDisplay.textContent = 'Lỗi tệp tin';
      fileNameDisplay.style.color = '#ef4444';
      fileUploadInput.value = '';
      uploadedQuestions = null;
    }
  };
  reader.readAsText(file);
}

// --- Bắt đầu làm bài ---
async function startQuiz() {
  // 1. Tải câu hỏi từ nguồn
  if (uploadedQuestions) {
    questionsData = uploadedQuestions;
  } else {
    const selectedFile = questionSourceSelect.value;
    try {
      const response = await fetch(`questions/${selectedFile}`);
      if (!response.ok) throw new Error('Không thể tải bộ câu hỏi');
      questionsData = await response.json();
    } catch (err) {
      alert('Đã xảy ra lỗi khi tải bộ câu hỏi có sẵn. Hãy tải tệp từ máy tính.');
      console.error(err);
      return;
    }
  }

  if (!questionsData || questionsData.length === 0) {
    alert('Không tìm thấy câu hỏi nào.');
    return;
  }

  // 2. Lấy chế độ hiển thị
  const selectedMode = document.querySelector('input[name="display-mode"]:checked');
  displayMode = selectedMode ? selectedMode.value : 'single';

  // 3. Chuẩn bị câu hỏi (Shuffle câu hỏi và shuffle đáp án)
  prepareQuestions();

  // 4. Khởi động Giao diện & Trạng thái làm bài
  currentIndex = 0;
  userAnswers = {};
  
  configScreen.classList.remove('active');
  quizScreen.classList.add('active');
  
  if (displayMode === 'single') {
    nextQuestionBtn.classList.add('hidden');
    submitListBtn.classList.add('hidden');
    renderSingleQuestion();
  } else {
    nextQuestionBtn.classList.add('hidden');
    submitListBtn.classList.remove('hidden');
    renderListQuestions();
  }

  // 5. Khởi động Timer
  startTimer();
}

// --- Shuffle thuật toán Fisher-Yates ---
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// --- Chuẩn bị và Shuffle câu hỏi cùng đáp án ---
function prepareQuestions() {
  // Tạo bản sao sâu để tránh chỉnh sửa mảng gốc
  currentQuestions = JSON.parse(JSON.stringify(questionsData));
  
  // Trộn thứ tự các câu hỏi
  shuffleArray(currentQuestions);

  // Trộn thứ tự các đáp án trong từng câu hỏi
  currentQuestions.forEach(q => {
    const letters = ['A', 'B', 'C', 'D'];
    
    // Lưu đáp án đúng gốc trước khi trộn
    const originalCorrectText = q.answers[q.correctAnswerIndex];

    // Tạo danh sách cặp [{text: string, originalIndex: number}] để theo dõi
    let mappedAnswers = q.answers.map((ans, idx) => ({
      text: ans,
      index: idx
    }));

    // Trộn đáp án
    shuffleArray(mappedAnswers);

    // Cập nhật lại mảng đáp án mới và tìm chỉ số đúng mới
    q.answers = mappedAnswers.map(item => item.text);
    
    const newCorrectIdx = q.answers.indexOf(originalCorrectText);
    q.correctAnswerIndex = newCorrectIdx;
    q.correctAnswer = letters[newCorrectIdx];
  });
}

// --- Bộ đếm thời gian ---
function startTimer() {
  startTime = Date.now();
  if (timerInterval) clearInterval(timerInterval);
  
  timerInterval = setInterval(() => {
    const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
    const mins = String(Math.floor(elapsedSeconds / 60)).padStart(2, '0');
    const secs = String(elapsedSeconds % 60).padStart(2, '0');
    quizTimer.textContent = `${mins}:${secs}`;
  }, 1000);
}

// --- Hiển thị câu hỏi chế độ Câu đơn ---
function renderSingleQuestion() {
  questionsContainer.innerHTML = '';
  nextQuestionBtn.classList.add('hidden');

  const q = currentQuestions[currentIndex];
  quizProgressText.textContent = `Câu hỏi ${currentIndex + 1} / ${currentQuestions.length}`;
  progressFill.style.width = `${((currentIndex) / currentQuestions.length) * 100}%`;

  const qBlock = document.createElement('div');
  qBlock.className = 'question-block';

  const qText = document.createElement('div');
  qText.className = 'question-text';
  qText.textContent = q.question;
  qBlock.appendChild(qText);

  const answersList = document.createElement('div');
  answersList.className = 'answers-list';

  const letters = ['A', 'B', 'C', 'D'];
  q.answers.forEach((ans, idx) => {
    const opt = document.createElement('div');
    opt.className = 'answer-option';
    opt.dataset.index = idx;
    opt.dataset.letter = letters[idx];

    // Chỉ số A, B, C, D tròn
    const indexSpan = document.createElement('span');
    indexSpan.className = 'answer-index';
    indexSpan.textContent = letters[idx];

    // Nội dung đáp án
    const textSpan = document.createElement('span');
    textSpan.className = 'answer-text';
    textSpan.textContent = ans;

    opt.appendChild(indexSpan);
    opt.appendChild(textSpan);

    opt.addEventListener('click', () => handleSingleAnswerSelect(opt, q, letters[idx], idx));
    answersList.appendChild(opt);
  });

  qBlock.appendChild(answersList);
  questionsContainer.appendChild(qBlock);
}

// --- Xử lý click chọn đáp án trong chế độ câu đơn ---
function handleSingleAnswerSelect(selectedOpt, q, selectedLetter, selectedIdx) {
  // Vô hiệu hóa click các câu trả lời khác
  const options = questionsContainer.querySelectorAll('.answer-option');
  options.forEach(opt => {
    opt.classList.add('disabled');
  });

  // Lưu câu trả lời của người dùng
  userAnswers[q.id] = selectedLetter;

  const isCorrect = (selectedIdx === q.correctAnswerIndex);

  if (isCorrect) {
    selectedOpt.classList.add('correct');
  } else {
    selectedOpt.classList.add('wrong');
    // Hiển thị đáp án đúng
    const correctOpt = questionsContainer.querySelector(`.answer-option[data-index="${q.correctAnswerIndex}"]`);
    if (correctOpt) {
      correctOpt.classList.add('correct');
    }
  }

  // Hiện nút "Tiếp tục"
  nextQuestionBtn.classList.remove('hidden');
}

// --- Chuyển câu tiếp theo ---
function goToNextQuestion() {
  currentIndex++;
  if (currentIndex < currentQuestions.length) {
    renderSingleQuestion();
  } else {
    finishQuiz();
  }
}

// --- Hiển thị câu hỏi chế độ Danh sách ---
function renderListQuestions() {
  questionsContainer.innerHTML = '';
  quizProgressText.textContent = `Chế độ hiển thị: Toàn bộ danh sách (${currentQuestions.length} câu)`;
  progressFill.style.width = '100%';

  currentQuestions.forEach((q, qIdx) => {
    const qBlock = document.createElement('div');
    qBlock.className = 'question-block';
    qBlock.style.borderBottom = '1px solid var(--card-border)';
    qBlock.style.paddingBottom = '20px';

    const qText = document.createElement('div');
    qText.className = 'question-text';
    qText.textContent = `${qIdx + 1}. ${q.question.replace(/^Câu\s+\d+\.\s*/i, '')}`;
    qBlock.appendChild(qText);

    const answersList = document.createElement('div');
    answersList.className = 'answers-list';

    const letters = ['A', 'B', 'C', 'D'];
    q.answers.forEach((ans, idx) => {
      const opt = document.createElement('div');
      opt.className = 'answer-option';
      opt.dataset.qId = q.id;
      opt.dataset.letter = letters[idx];

      const indexSpan = document.createElement('span');
      indexSpan.className = 'answer-index';
      indexSpan.textContent = letters[idx];

      const textSpan = document.createElement('span');
      textSpan.className = 'answer-text';
      textSpan.textContent = ans;

      opt.appendChild(indexSpan);
      opt.appendChild(textSpan);

      opt.addEventListener('click', () => {
        // Xóa class selected của các option cùng câu hỏi
        const siblings = answersList.querySelectorAll('.answer-option');
        siblings.forEach(s => s.classList.remove('selected'));

        opt.classList.add('selected');
        userAnswers[q.id] = letters[idx];
      });

      answersList.appendChild(opt);
    });

    qBlock.appendChild(answersList);
    questionsContainer.appendChild(qBlock);
  });
}

// --- Hoàn thành/Nộp bài thi ---
function finishQuiz() {
  clearInterval(timerInterval);
  quizScreen.classList.remove('active');
  resultScreen.classList.add('active');

  // Tính toán kết quả
  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  const wrongQuestions = [];

  currentQuestions.forEach(q => {
    const userAns = userAnswers[q.id];
    if (userAns === undefined) {
      unansweredCount++;
      // Coi như sai và thêm vào danh sách xem lại
      wrongQuestions.push({
        question: q,
        userAnswer: null
      });
    } else if (userAns === q.correctAnswer) {
      correctCount++;
    } else {
      wrongCount++;
      wrongQuestions.push({
        question: q,
        userAnswer: userAns
      });
    }
  });

  const total = currentQuestions.length;
  const percent = total > 0 ? Math.round((correctCount / total) * 100) : 0;

  // Hiển thị điểm số
  scorePercentage.textContent = `${percent}%`;
  scoreFraction.textContent = `${correctCount} / ${total}`;
  correctCountText.textContent = correctCount;
  wrongCountText.textContent = wrongCount;
  unansweredCountText.textContent = unansweredCount;

  // Hiển thị danh sách câu sai
  wrongQuestionsList.innerHTML = '';
  if (wrongQuestions.length > 0) {
    wrongQuestionsSection.classList.remove('hidden');

    wrongQuestions.forEach(({ question, userAnswer }, idx) => {
      const reviewCard = document.createElement('div');
      reviewCard.className = 'review-card';

      const revTitle = document.createElement('div');
      revTitle.className = 'review-question';
      revTitle.textContent = `[Câu ${question.id}] - ${question.question}`;
      reviewCard.appendChild(revTitle);

      const revAnswers = document.createElement('div');
      revAnswers.className = 'review-answers';

      const letters = ['A', 'B', 'C', 'D'];
      question.answers.forEach((ans, aIdx) => {
        const item = document.createElement('div');
        item.className = 'review-answer-item';
        item.textContent = `${letters[aIdx]}. ${ans}`;

        // Đánh dấu đáp án đúng màu xanh
        if (letters[aIdx] === question.correctAnswer) {
          item.classList.add('correct-ans');
        }
        // Đánh dấu đáp án sai của user màu đỏ
        if (userAnswer && letters[aIdx] === userAnswer && userAnswer !== question.correctAnswer) {
          item.classList.add('user-wrong');
        }

        revAnswers.appendChild(item);
      });

      if (!userAnswer) {
        const warningNoAns = document.createElement('div');
        warningNoAns.style.marginTop = '10px';
        warningNoAns.style.fontSize = '0.9rem';
        warningNoAns.style.color = 'var(--danger)';
        warningNoAns.textContent = '⚠️ Bạn chưa trả lời câu hỏi này';
        reviewCard.appendChild(warningNoAns);
      }

      reviewCard.appendChild(revAnswers);
      wrongQuestionsList.appendChild(reviewCard);
    });
  } else {
    wrongQuestionsSection.classList.add('hidden');
  }
}

// --- Quay lại màn hình thiết lập ---
function resetApp() {
  resultScreen.classList.remove('active');
  configScreen.classList.add('active');
  // Giữ lại file custom nếu có
}
