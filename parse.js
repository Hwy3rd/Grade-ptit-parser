const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, 'input');
const outputDir = path.join(__dirname, 'questions');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

try {
  // Đọc các file .txt trong folder input
  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.txt'));
  
  files.forEach(file => {
    const inputFile = path.join(inputDir, file);
    // Lưu file JSON output cùng tên nhưng đổi đuôi .txt sang .json
    const outputFilename = file.replace(/\.txt$/, '.json');
    const outputFile = path.join(outputDir, outputFilename);
    
    const data = fs.readFileSync(inputFile, 'utf8');
    const lines = data.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);

    const questionLines = [];
    const answerSheetLines = [];

    // Tách dòng câu hỏi và dòng bảng đáp án
    for (const line of lines) {
      // Nhận diện dòng bảng đáp án linh hoạt hơn: chứa nhiều cụm ví dụ "1D", "1.D", "2A", "2.A"...
      if (/^\d+\.?[A-D](\s+\d+\.?[A-D])*$/.test(line)) {
        answerSheetLines.push(line);
      } else {
        questionLines.push(line);
      }
    }

    // Phân tích bảng đáp án
    const answerMap = new Map();
    const answerSheetStr = answerSheetLines.join(' ');
    const answerPairs = answerSheetStr.split(/\s+/);
    for (const pair of answerPairs) {
      // Hỗ trợ cả định dạng "1D" và "1.D"
      const match = pair.match(/^(\d+)\.?([A-D])$/);
      if (match) {
        const qNum = parseInt(match[1], 10);
        const ansLetter = match[2];
        answerMap.set(qNum, ansLetter);
      }
    }

    // Phân tích các câu hỏi
    const questions = [];
    let i = 0;
    while (i < questionLines.length) {
      const line = questionLines[i];
      const qMatch = line.match(/^Câu\s+(\d+)\.\s*(.*)/i);
      if (qMatch) {
        const qId = parseInt(qMatch[1], 10);
        const questionText = qMatch[2] ? qMatch[2].trim() : '';
        
        const answers = [];
        for (let j = 1; j <= 4; j++) {
          if (i + j < questionLines.length) {
            let ansText = questionLines[i + j];
            // Loại bỏ tiền tố "a. ", "b. ", "c. ", "d. " nếu có ở đáp án để hiển thị sạch sẽ
            ansText = ansText.replace(/^[a-d]\.\s*/i, '');
            answers.push(ansText);
          }
        }

        const correctAnswerLetter = answerMap.get(qId) || '';
        const letterToIndex = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };
        const correctAnswerIndex = letterToIndex[correctAnswerLetter] !== undefined ? letterToIndex[correctAnswerLetter] : -1;

        questions.push({
          id: qId,
          question: `Câu ${qId}. ${questionText}`,
          answers: answers,
          correctAnswer: correctAnswerLetter,
          correctAnswerIndex: correctAnswerIndex
        });

        i += 5;
      } else {
        i++;
      }
    }

    fs.writeFileSync(outputFile, JSON.stringify(questions, null, 2), 'utf8');
    console.log(`Successfully parsed ${questions.length} questions from ${file} to ${outputFile}`);
  });
} catch (err) {
  console.error('Error processing files:', err);
}

