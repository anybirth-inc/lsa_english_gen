import { GoogleGenerativeAI } from '@google/generative-ai';

if (!import.meta.env.VITE_GEMINI_API_KEY) {
  throw new Error('VITE_GEMINI_API_KEY is not defined in environment variables');
}

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function generateSentences(combinations: { presentType: string; level: number | string; category: string }[]): Promise<string[]> {
  const results: string[] = [];
  const maxRetries = 3;
  const retryDelay = 5000;
  const initialDelay = 1000;
  const batchSize = 4;

  const model = genAI.getGenerativeModel({ 
    model: 'gemini-pro',
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.9,
      maxOutputTokens: 200,
    },
  });

  const generateSingle = async (combination: typeof combinations[0], index: number): Promise<string> => {
    let attempts = 0;
    let success = false;

    await delay(initialDelay * (index % batchSize));

    while (attempts < maxRetries && !success) {
      try {
        if (attempts > 0) {
          await delay(retryDelay * Math.pow(2, attempts - 1));
        }

        const prompt = createSinglePrompt(combination);
        const safePrompt = prompt.trim().slice(0, 1000);

        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: safePrompt }] }],
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            },
            {
              category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE'
            }
          ]
        });
        
        if (!result.response) {
          throw new Error('No response from Gemini API');
        }

        const text = result.response.text();
        
        if (!text || text.length < 10) {
          throw new Error('Invalid response length');
        }

        const lines = text.split('\n').filter(line => line.trim());
        const japaneseMatch = lines.find(line => line.startsWith('日本語:'));
        const englishMatch = lines.find(line => line.startsWith('英語:'));

        if (!japaneseMatch || !englishMatch) {
          throw new Error('Invalid response format');
        }

        const japanese = japaneseMatch.replace('日本語:', '').trim();
        const english = englishMatch.replace('英語:', '').trim();

        if (japanese.length < 5 || english.length < 5) {
          throw new Error('Response too short');
        }

        success = true;
        return `日本語: ${japanese}\n英語: ${english}`;

      } catch (error) {
        attempts++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Gemini API Error:', { error: errorMessage, attempt: attempts });
        
        if (attempts === maxRetries) {
          return `日本語: エラーが発生しました\n英語: An error occurred`;
        }
      }
    }
    return `日本語: エラーが発生しました\n英語: An error occurred`;
  };

  for (let i = 0; i < combinations.length; i += batchSize) {
    const batch = combinations.slice(i, i + batchSize);
    if (i > 0) {
      await delay(2000);
    }
    const batchResults = await Promise.all(
      batch.map((combination, index) => generateSingle(combination, i + index))
    );
    results.push(...batchResults);
  }
  
  return results;
}

function createSinglePrompt({ presentType, level, category }: { presentType: string; level: number | string; category: string }): string {
  const scenes = {
    'Life': '日常生活での',
    'Business': 'ビジネスでの',
    'School': '学校での',
    'Hobby': '趣味に関する'
  };

  const complexity = {
    1: '簡単な',
    2: 'やや複雑な',
    3: '複雑な',
    'business 1': 'ビジネスの基本的な',
    'business 2': 'ビジネスの複雑な'
  };

  const subject = presentType.toLowerCase().replace('he/she', 'he/she/they').split('/')[0];

  return `Create a simple present tense sentence pair in Japanese and English.
Subject: "${subject}"
Context: ${scenes[category]}${complexity[level]}

Required format:
日本語: [Japanese sentence]
英語: [English sentence]

Guidelines:
1. Simple present tense only
2. Start with the given subject
3. Natural and correct grammar
4. Match the specified context
5. Length (words):
   - Level 1: 4-7
   - Level 2: 6-9
   - Level 3: 7-11
   - Business: 5-15

Example:
日本語: 彼は毎朝コーヒーを飲みます。
英語: He drinks coffee every morning.`;
}

export async function evaluateAnswer(correctAnswer: string, userAnswer: string): Promise<string> {
  const model = genAI.getGenerativeModel({ 
    model: 'gemini-pro',
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1000,
    },
  });

  const prompt = `
あなたは英語教師として生徒の回答を評価します。

正解: "${correctAnswer}"
生徒の回答: "${userAnswer}"

以下の構造でJSONレスポンスを提供してください：
{
  "score": (0-100の数値),
  "grammarCorrect": (真偽値),
  "wordOrderCorrect": (真偽値),
  "pronounCorrect": (真偽値),
  "verbCorrect": (真偽値),
  "feedback": (日本語でのフィードバック),
  "improvements": (日本語での改善点の配列)
}

採点基準:
- 完全一致: 100点
- 代名詞の誤り: -30点
- 動詞の誤り: -20点
- 語順の誤り: -20点
- その他の文法ミス: -10点
- スペルミス: 1つにつき-5点

重要なルール:
1. 代名詞の違い（he/she/it/they）は重大なミスとして扱う
2. 大文字小文字の違いは無視する
3. 句読点の違いは無視する
4. 動詞の時制は厳密にチェックする
5. 語順は重要

レスポンス例:
{
  "score": 70,
  "grammarCorrect": true,
  "wordOrderCorrect": true,
  "pronounCorrect": false,
  "verbCorrect": true,
  "feedback": "全体的によく書けていますが、代名詞の使い方に誤りがあります。",
  "improvements": ["'she'の代わりに'he'を使用してください"]
}

JSONレスポンスのみを提供し、追加のテキストは含めないでください。`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }
      
      const evaluation = JSON.parse(jsonMatch[0]);
      
      const scoreColor = evaluation.score >= 90 ? 'text-green-600' :
                        evaluation.score >= 70 ? 'text-yellow-600' :
                        'text-red-600';

      const checkIcon = '✓';
      const crossIcon = '✗';

      return `
        <div class="space-y-4">
          <div class="flex items-center justify-between">
            <div class="text-3xl font-bold ${scoreColor}">
              ${evaluation.score}点
            </div>
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="flex items-center">
              <span class="${evaluation.pronounCorrect ? 'text-green-600' : 'text-red-600'} mr-2">
                ${evaluation.pronounCorrect ? checkIcon : crossIcon}
              </span>
              <span class="text-sm">代名詞</span>
            </div>
            <div class="flex items-center">
              <span class="${evaluation.verbCorrect ? 'text-green-600' : 'text-red-600'} mr-2">
                ${evaluation.verbCorrect ? checkIcon : crossIcon}
              </span>
              <span class="text-sm">動詞</span>
            </div>
            <div class="flex items-center">
              <span class="${evaluation.wordOrderCorrect ? 'text-green-600' : 'text-red-600'} mr-2">
                ${evaluation.wordOrderCorrect ? checkIcon : crossIcon}
              </span>
              <span class="text-sm">語順</span>
            </div>
            <div class="flex items-center">
              <span class="${evaluation.grammarCorrect ? 'text-green-600' : 'text-red-600'} mr-2">
                ${evaluation.grammarCorrect ? checkIcon : crossIcon}
              </span>
              <span class="text-sm">文法</span>
            </div>
          </div>

          <div class="mt-4">
            <h4 class="font-medium text-gray-700 mb-2">フィードバック</h4>
            <p class="text-gray-600">${evaluation.feedback}</p>
          </div>

          ${evaluation.improvements.length > 0 ? `
            <div class="mt-4">
              <h4 class="font-medium text-gray-700 mb-2">改善点</h4>
              <ul class="list-disc list-inside text-gray-600 space-y-1">
                ${evaluation.improvements.map(imp => `<li>${imp}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
        </div>
      `;
    } catch (parseError) {
      console.error('Failed to parse evaluation:', parseError);
      return '<div class="text-red-600">評価結果の解析に失敗しました。もう一度お試しください。</div>';
    }
  } catch (error) {
    console.error('Evaluation error:', error);
    return '<div class="text-red-600">評価中にエラーが発生しました。もう一度お試しください。</div>';
  }
}