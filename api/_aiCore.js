const MODEL = 'gemini-2.5-flash';
const MAX_CONTENT_LENGTH = 12000;

function clean(value = '') {
  return String(value).replace(/[<>]/g, '').trim().slice(0, MAX_CONTENT_LENGTH);
}

function buildPrompt(body) {
  const type = clean(body.type || 'general');
  const subject = clean(body.subject || 'General');
  const topic = clean(body.topic || '');
  const difficulty = clean(body.difficulty || 'medium');
  const content = clean(body.content || '');
  const examDate = clean(body.examDate || '');

  const common = `You are CampusMate, a concise AI study assistant for Indian college students. Subject: ${subject}. Difficulty: ${difficulty}. Use clear headings, short bullets, and exam-focused language.`;

  const prompts = {
    'explain-topic': `${common}\nExplain the topic "${topic}". Include: simple explanation, important formula/concept, real-life example, common mistakes, 3 viva questions, and 3 MCQs with answers.`,
    viva: `${common}\nGenerate 10 viva questions for "${topic || subject}" with short answers, difficulty level, and important topics to revise.`,
    mcq: `${common}\nGenerate MCQs for "${topic || subject}". Each must have 4 options, correct answer, explanation, difficulty, and topic. If the user asks for JSON, return only a JSON array with question, options, correctAnswer, explanation, difficulty, and topic. Extra instruction/content: ${content || 'not provided'}.`,
    'study-plan': `${common}\nCreate a day-wise study plan for ${subject}. Exam date: ${examDate || 'not provided'}. Include unit priority, revision schedule, practice recommendation, and final day plan. Weak/current notes: ${content || 'not provided'}.`,
    'summarize-notes': `${common}\nSummarize these notes. Return: short summary, important points, definitions, formulas, viva questions, MCQs, and exam tips.\n\nNotes:\n${content}`,
    general: `${common}\nAnswer this student question/topic: ${topic || content}`,
  };

  return prompts[type] || prompts.general;
}

function offlineResponse(body) {
  const subject = clean(body.subject || 'your subject');
  const topic = clean(body.topic || body.content || 'this topic');
  const type = clean(body.type || 'general');

  if (type === 'mcq') {
    return `Demo MCQs for ${subject} - ${topic}\n\n1. Which concept best matches ${topic}?\nA. Core principle\nB. Random guess\nC. Unrelated topic\nD. None\nAnswer: A\nExplanation: Revise the definition, formula, and examples.\n\nAdd GEMINI_API_KEY in .env/Vercel for live AI generation.`;
  }

  if (type === 'study-plan') {
    return `Demo Study Plan for ${subject}\n\nDay 1: Revise fundamentals of ${topic}.\nDay 2: Practice solved examples and formulas.\nDay 3: Attempt MCQs and viva questions.\nFinal Day: Quick revision, weak topics, and past mistakes.\n\nAdd GEMINI_API_KEY in .env/Vercel for live AI generation.`;
  }

  return `Demo AI response for ${subject} - ${topic}\n\nSummary: Start with the basic definition, then connect it to formulas, examples, and common mistakes.\n\nImportant points:\n- Understand the core concept.\n- Practice 5 MCQs.\n- Prepare 3 viva answers.\n\nAdd GEMINI_API_KEY in .env/Vercel for live AI generation.`;
}

export async function handleAiRequest(body, env = process.env) {
  if (!body || typeof body !== 'object') {
    return { status: 400, body: { success: false, error: 'Invalid request body.' } };
  }

  const type = clean(body.type || 'general');
  const hasPrompt = clean(body.topic || body.content || body.subject);
  if (!hasPrompt) {
    return { status: 400, body: { success: false, error: 'Please enter a topic, subject, or notes content.' } };
  }

  const apiKey = env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      status: 200,
      body: {
        success: true,
        demo: true,
        data: offlineResponse({ ...body, type }),
      },
    };
  }

  try {
    const prompt = buildPrompt({ ...body, type });
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.72,
            topP: 0.9,
            maxOutputTokens: 1800,
          },
        }),
      },
    );

    if (!response.ok) {
      return {
        status: response.status,
        body: {
          success: false,
          error: 'AI is temporarily unavailable. Please try again.',
        },
      };
    }

    const json = await response.json();
    const text = json?.candidates?.[0]?.content?.parts?.map((part) => part.text).join('\n').trim();

    if (!text) {
      return {
        status: 502,
        body: {
          success: false,
          error: 'AI returned an empty response. Please try again.',
        },
      };
    }

    return { status: 200, body: { success: true, data: text } };
  } catch {
    return {
      status: 500,
      body: {
        success: false,
        error: 'AI is temporarily unavailable. Please try again.',
      },
    };
  }
}
