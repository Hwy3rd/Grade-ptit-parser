const fs = require('fs');
const path = require('path');

const inputDir = path.join(__dirname, 'input');
const outputDir = path.join(__dirname, 'questions');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

try {
  const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.json'));
  
  files.forEach(file => {
    const inputFile = path.join(inputDir, file);
    const outputFile = path.join(outputDir, file);
    
    const data = fs.readFileSync(inputFile, 'utf8');
    const lines = data.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);

    const questionLines = [];
    const answerSheetLines = [];

    for (const line of lines) {
      if (/^\d+\.[A-D](\s+\d+\.[A-D])*$/.test(line)) {
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
      const match = pair.match(/^(\d+)\.([A-D])$/);
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
            answers.push(questionLines[i + j]);
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

