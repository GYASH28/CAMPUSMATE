export function calculateQuizResult(questions, answers) {
  const totalQuestions = questions.length;
  let correctAnswers = 0;
  const wrongAnswers = [];
  const weakTopics = new Set();

  questions.forEach((question) => {
    const selected = answers[question.id];
    if (selected === question.correctAnswer) {
      correctAnswers += 1;
    } else {
      wrongAnswers.push({
        questionId: question.id,
        question: question.question,
        selected,
        correctAnswer: question.correctAnswer,
        topic: question.topic || question.unit,
      });
      weakTopics.add(question.topic || question.unit || question.subjectName);
    }
  });

  const score = correctAnswers;
  const percentage = totalQuestions ? Math.round((score / totalQuestions) * 100) : 0;

  return {
    score,
    totalQuestions,
    percentage,
    correctAnswers,
    wrongAnswers: wrongAnswers.length,
    wrongDetails: wrongAnswers,
    weakTopics: Array.from(weakTopics).slice(0, 8),
  };
}

export function parseAiMcqs(text, subject) {
  try {
    const parsed = JSON.parse(text);
    const items = Array.isArray(parsed) ? parsed : parsed.questions;
    if (Array.isArray(items)) {
      return items.map((item, index) => ({
        question: item.question || `Generated question ${index + 1}`,
        options: item.options || ['A', 'B', 'C', 'D'],
        correctAnswer: item.correctAnswer || item.answer || item.options?.[0] || 'A',
        explanation: item.explanation || 'Review the related concept.',
        difficulty: item.difficulty || 'medium',
        topic: item.topic || subject,
      }));
    }
  } catch {
    // Fall back to a readable starter question if AI returns prose.
  }

  return [
    {
      question: `What is an important concept in ${subject}?`,
      options: ['Definition', 'Syntax error', 'Random value', 'None'],
      correctAnswer: 'Definition',
      explanation: text.slice(0, 240) || 'Review the topic before saving.',
      difficulty: 'medium',
      topic: subject,
    },
  ];
}
