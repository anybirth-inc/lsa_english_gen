import React, { useState } from 'react';
import { GeneratedSentence } from '../types';
import SentenceTable from './SentenceTable';
import { Save } from 'lucide-react';

interface GeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  generatedSentences: GeneratedSentence[];
  onToggleSelect: (id: string) => void;
  isGenerating: boolean;
  progress: number;
}

const API_URL = 'https://script.google.com/macros/s/AKfycbz3DTxrhP6SbtY1BASOmzmUg0WGhmcYehpwgJmLqaZ-0YTrZjUmtltjVSziIGNnQSqAlQ/exec';

const GeneratorModal: React.FC<GeneratorModalProps> = ({
  isOpen,
  onClose,
  generatedSentences,
  onToggleSelect,
  isGenerating,
  progress
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [saveResult, setSaveResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveResult(null);

    try {
      const selectedSentences = generatedSentences.filter(s => s.selected);
      
      if (selectedSentences.length === 0) {
        setSaveResult({
          success: false,
          message: '保存する問題を選択してください。'
        });
        setIsSaving(false);
        return;
      }

      const myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("Accept", "application/json");

      const data = selectedSentences.map(s => ({
        english: s.english,
        japanese: s.japanese,
        level: s.level.toString(),
        present_type: s.present_type,
        contents_type: s.contents_type
      }));

      const requestOptions: RequestInit = {
        method: 'POST',
        headers: myHeaders,
        body: JSON.stringify({ data }),
        mode: 'no-cors',
        credentials: 'omit',
        redirect: 'follow' as RequestRedirect
      };

      try {
        console.log('Sending request with data:', data);
        const response = await fetch(API_URL, requestOptions);
        console.log('Response received:', response);
        
        if (response.type === 'opaque') {
          setSaveResult({
            success: true,
            message: `${selectedSentences.length}件の問題を送信しました。`
          });
          return;
        }
        
        if (response.status === 404) {
          throw new Error('APIエンドポイントが見つかりません。URLを確認してください。');
        }
        
        if (response.status === 403) {
          throw new Error('APIへのアクセスが拒否されました。権限を確認してください。');
        }
        
        if (response.status === 429) {
          throw new Error('リクエストの制限に達しました。しばらく待ってから再度お試しください。');
        }
        
        if (!response.ok) {
          throw new Error(`サーバーエラーが発生しました。ステータス: ${response.status}`);
        }

        let result;
        try {
          result = await response.json();
        } catch (parseError) {
          throw new Error('サーバーからの応答を解析できませんでした。');
        }
        
        if (!result) {
          throw new Error('サーバーから空の応答が返されました。');
        }
        
        if (result.status === 'success') {
          setSaveResult({
            success: true,
            message: `${selectedSentences.length}件の問題を登録しました。`
          });
        } else {
          throw new Error(result.message || '問題の登録に失敗しました。');
        }
      } catch (error) {
        console.error('Save error:', error);
        
        let errorMessage: string;
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
        } else if (error instanceof Error) {
          errorMessage = error.message;
        } else {
          errorMessage = '予期せぬエラーが発生しました。しばらく待ってから再度お試しください。';
        }
        
        setSaveResult({
          success: false,
          message: errorMessage
        });
      }
    } catch (outerError) {
      console.error('Outer error:', outerError);
      setSaveResult({
        success: false,
        message: '予期せぬエラーが発生しました。しばらく待ってから再度お試しください。'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-11/12 max-w-6xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">生成された問題一覧</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {isGenerating && (
          <div className="mb-6 bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="font-medium">問題を生成中... {Math.round(progress)}%</span>
            </div>
            <div className="bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-in-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {saveResult && (
          <div
            className={`mb-4 p-4 rounded-lg ${
              saveResult.success
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {saveResult.message}
          </div>
        )}

        <div className="mb-4">
          <button
            onClick={handleSave}
            disabled={isSaving || isGenerating}
            className={`flex items-center px-4 py-2 rounded-lg ${
              isSaving || isGenerating
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700'
            } text-white font-medium transition-colors`}
          >
            <Save className="w-5 h-5 mr-2" />
            {isSaving ? '保存中...' : '選択した問題を保存'}
          </button>
        </div>

        <SentenceTable
          sentences={generatedSentences}
          onToggleSelect={onToggleSelect}
        />
      </div>
    </div>
  );
};

export default GeneratorModal;