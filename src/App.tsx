import React, { useState, useCallback, useEffect } from 'react';
import { BookOpen, RefreshCw, Plus, Mic } from 'lucide-react';
import { generateSentences } from './utils/gemini';
import { evaluateAnswer } from './utils/gemini';
import { startSpeechRecognition } from './utils/speech';
import { Sentence, GeneratedSentence } from './types';
import GeneratorModal from './components/GeneratorModal';

const API_URL = 'https://script.googleusercontent.com/macros/echo?user_content_key=hMIYJE8jZ5ikMwLFVsP2q6o-H4gSMnpNjipLubAlL19X52LDOjsFnqwtK7UGnPt_s5pPIx98DjWmMg0HDq0_zs0Q3Lv4zNham5_BxDlH2jW0nuo2oDemN9CCS2h10ox_1xSncGQajx_ryfhECjZEnFGeEfedxKUqLzoHlqoq3qOSrYYbYgzgVgaZhtHAFM5fUPyI6Vjnvc9ZC_6r-op_KyidLZfGtoGI94weD1x22fgQGHq81uQcm9z9Jw9Md8uu&lib=MHWbxWxso34rA-vRD4Yi0nj8oUYCUIwTU';

const categories = ['Life', 'Business', 'School', 'Hobby'] as const;
const pronouns = ['I', 'HE/SHE', 'IT', 'WE', 'THEY'] as const;
const levels = [1, 2, 3] as const;

function App() {
  const [sentences, setSentences] = useState<Sentence[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Life');
  const [selectedPronoun, setSelectedPronoun] = useState<string>('HE/SHE');
  const [selectedLevel, setSelectedLevel] = useState<number>(1);
  const [currentSentence, setCurrentSentence] = useState<Sentence | null>(null);
  const [showEnglish, setShowEnglish] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedSentences, setGeneratedSentences] = useState<GeneratedSentence[]>([]);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [tempSpeechInput, setTempSpeechInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<string | null>(null);

  useEffect(() => {
    fetchSentences();
  }, []);

  const fetchSentences = async () => {
    try {
      const response = await fetch(API_URL);
      const data = await response.json();
      if (data.status === 'success' && Array.isArray(data.data)) {
        setSentences(data.data);
        const filtered = filterSentences(data.data);
        if (filtered.length > 0) {
          setCurrentSentence(filtered[0]);
        }
      }
    } catch (err) {
      setError('データの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const filterSentences = useCallback((sentenceList: Sentence[]) => {
    return sentenceList.filter(
      (s) =>
        s.contents_type === selectedCategory &&
        s.present_type === selectedPronoun &&
        s.level === selectedLevel
    );
  }, [selectedCategory, selectedPronoun, selectedLevel]);

  const handleNextSentence = useCallback(() => {
    const filtered = filterSentences(sentences);
    if (filtered.length === 0) {
      setError('選択された条件に一致する問題がありません');
      return;
    }
    const currentIndex = currentSentence
      ? filtered.findIndex((s) => s.id === currentSentence.id)
      : -1;
    const nextIndex = (currentIndex + 1) % filtered.length;
    setCurrentSentence(filtered[nextIndex]);
    setShowEnglish(false);
    setUserInput('');
    setTempSpeechInput('');
    setEvaluation(null);
  }, [currentSentence, sentences, filterSentences]);

  const handleFilterChange = useCallback(
    (category?: string, pronoun?: string, level?: number) => {
      const newCategory = category ?? selectedCategory;
      const newPronoun = pronoun ?? selectedPronoun;
      const newLevel = level ?? selectedLevel;

      setSelectedCategory(newCategory);
      setSelectedPronoun(newPronoun);
      setSelectedLevel(newLevel);

      const filtered = filterSentences(sentences);
      if (filtered.length > 0) {
        setCurrentSentence(filtered[0]);
        setShowEnglish(false);
        setError(null);
      } else {
        setError('選択された条件に一致する問題がありません');
      }
    },
    [sentences, selectedCategory, selectedPronoun, selectedLevel, filterSentences]
  );

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    setGeneratedSentences([]);
    setIsModalOpen(true);
    setError(null);

    const combinations = [];
    let totalCombinations = 0;
    let processedCombinations = 0;

    try {
      for (const category of categories) {
        for (const pronoun of pronouns) {
          for (const level of levels) {
            combinations.push({ category, presentType: pronoun, level });
            totalCombinations++;
          }
        }
      }

      const batchSize = 10;
      const batches = [];
      for (let i = 0; i < combinations.length; i += batchSize) {
        batches.push(combinations.slice(i, i + batchSize));
      }

      const newSentences: GeneratedSentence[] = [];
      let nextId = 1;

      for (const batch of batches) {
        try {
          const results = await generateSentences(batch);
          
          for (let i = 0; i < results.length; i++) {
            const result = results[i];
            const combination = batch[i];
            
            const lines = result.split('\n');
            const japanese = lines.find(line => line.startsWith('日本語:'))?.replace('日本語:', '').trim() || '';
            const english = lines.find(line => line.startsWith('英語:'))?.replace('英語:', '').trim() || '';

            if (japanese && english) {
              newSentences.push({
                id: `gen_${nextId++}`,
                japanese,
                english,
                level: combination.level,
                present_type: combination.presentType,
                contents_type: combination.category,
                selected: true
              });
            }
          }

          processedCombinations += batch.length;
          const progress = (processedCombinations / totalCombinations) * 100;
          setGenerationProgress(progress);
          setGeneratedSentences([...newSentences]);

        } catch (error) {
          console.error('Batch generation error:', error);
          continue;
        }
      }

      if (newSentences.length > 0) {
        setGeneratedSentences(newSentences);
        setError(null);
      } else {
        setError('問題の生成に失敗しました。もう一度お試しください。');
      }
    } catch (error) {
      setError('問題の生成中にエラーが発生しました。');
      console.error('Error generating sentences:', error);
    } finally {
      setIsGenerating(false);
      setGenerationProgress(100);
    }
  };

  const handleToggleSelect = (id: string) => {
    setGeneratedSentences(prev =>
      prev.map(sentence =>
        sentence.id === id
          ? { ...sentence, selected: !sentence.selected }
          : sentence
      )
    );
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    startSpeechRecognition(
      (text) => {
        setTempSpeechInput(text);
        setIsRecording(false);
      },
      () => setIsRecording(false)
    );
  };

  const handleSubmitAnswer = async () => {
    if (!currentSentence) return;
    
    const answer = userInput || tempSpeechInput;
    if (!answer.trim()) return;

    setIsEvaluating(true);
    try {
      const result = await evaluateAnswer(currentSentence.english, answer);
      setEvaluation(result);
      setShowEnglish(true);
    } finally {
      setIsEvaluating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-4 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <BookOpen className="w-6 h-6 md:w-8 md:h-8 text-blue-600 mr-2" />
              <h1 className="text-xl md:text-3xl font-bold text-gray-800">英語学習アプリ</h1>
            </div>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`flex items-center px-3 py-1.5 md:px-4 md:py-2 rounded-lg text-sm md:text-base ${
                isGenerating
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white font-medium transition-colors`}
            >
              <Plus className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
              {isGenerating ? '生成中...' : '問題を生成'}
            </button>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}

          <div className="space-y-4 md:space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                カテゴリを選択:
              </label>
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => handleFilterChange(category)}
                    className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-sm font-medium transition-colors
                      ${selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                代名詞を選択:
              </label>
              <div className="flex flex-wrap gap-2">
                {pronouns.map((pronoun) => (
                  <button
                    key={pronoun}
                    onClick={() => handleFilterChange(undefined, pronoun)}
                    className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-sm font-medium transition-colors
                      ${selectedPronoun === pronoun
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    {pronoun}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                レベルを選択:
              </label>
              <div className="flex flex-wrap gap-2">
                {levels.map((level) => (
                  <button
                    key={level}
                    onClick={() => handleFilterChange(undefined, undefined, level)}
                    className={`px-3 py-1.5 md:px-4 md:py-2 rounded-full text-sm font-medium transition-colors
                      ${selectedLevel === level
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                  >
                    Level {level}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {currentSentence && (
            <div className="bg-gray-50 rounded-lg p-4 md:p-6 my-4 md:my-6">
              <p className="text-lg md:text-xl mb-4 text-gray-800">{currentSentence.japanese}</p>
              
              <div className="flex flex-col md:flex-row gap-2 md:gap-4 mb-4">
                <input
                  type="text"
                  value={userInput || tempSpeechInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="英語で答えを入力..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleStartRecording}
                    disabled={isRecording}
                    className={`px-4 py-2 rounded-lg ${
                      isRecording
                        ? 'bg-red-500'
                        : 'bg-blue-600 hover:bg-blue-700'
                    } text-white`}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={isEvaluating || (!userInput && !tempSpeechInput)}
                    className={`px-6 py-2 rounded-lg font-medium ${
                      isEvaluating || (!userInput && !tempSpeechInput)
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-green-600 hover:bg-green-700'
                    } text-white flex-1 md:flex-none`}
                  >
                    {isEvaluating ? '評価中...' : '回答を確認'}
                  </button>
                </div>
              </div>

              {showEnglish && (
                <>
                  <p className="text-lg md:text-xl text-blue-600 font-medium mb-4">
                    {currentSentence.english}
                  </p>
                  {isEvaluating ? (
                    <div className="flex items-center justify-center p-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                      <span className="ml-3 text-gray-600">評価中...</span>
                    </div>
                  ) : evaluation && (
                    <div className="mt-4 space-y-4">
                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                          <h3 className="text-lg font-medium text-gray-800">回答の比較</h3>
                        </div>
                        <div className="p-4 space-y-2">
                          <div>
                            <span className="font-medium text-gray-700">正解:</span>
                            <span className="ml-2 text-green-600">{currentSentence.english}</span>
                          </div>
                          <div>
                            <span className="font-medium text-gray-700">あなたの回答:</span>
                            <span className="ml-2 text-blue-600">{userInput || tempSpeechInput}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                          <h3 className="text-lg font-medium text-gray-800">評価結果</h3>
                        </div>
                        <div className="p-4">
                          <div dangerouslySetInnerHTML={{ __html: evaluation }} />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <div className="flex gap-4">
            <button
              onClick={handleNextSentence}
              className="flex-1 bg-blue-600 text-white px-4 py-2 md:px-6 md:py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center"
            >
              <RefreshCw className="w-4 h-4 md:w-5 md:h-5 mr-1 md:mr-2" />
              次の問題
            </button>
          </div>
        </div>
      </div>

      <GeneratorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        generatedSentences={generatedSentences}
        onToggleSelect={handleToggleSelect}
        isGenerating={isGenerating}
        progress={generationProgress}
      />
    </div>
  );
}

export default App;