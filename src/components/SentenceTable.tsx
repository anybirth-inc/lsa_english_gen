import React from 'react';
import { GeneratedSentence } from '../types';

interface SentenceTableProps {
  sentences: GeneratedSentence[];
  onToggleSelect: (id: string) => void;
}

const SentenceTable: React.FC<SentenceTableProps> = ({ sentences, onToggleSelect }) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white rounded-lg overflow-hidden">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2">選択</th>
            <th className="px-4 py-2">カテゴリ</th>
            <th className="px-4 py-2">代名詞</th>
            <th className="px-4 py-2">レベル</th>
            <th className="px-4 py-2">日本語</th>
            <th className="px-4 py-2">英語</th>
          </tr>
        </thead>
        <tbody>
          {sentences.map((sentence) => (
            <tr key={sentence.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2 text-center">
                <input
                  type="checkbox"
                  checked={sentence.selected}
                  onChange={() => onToggleSelect(sentence.id)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </td>
              <td className="px-4 py-2">{sentence.contents_type}</td>
              <td className="px-4 py-2">{sentence.present_type}</td>
              <td className="px-4 py-2">Level {sentence.level}</td>
              <td className="px-4 py-2">{sentence.japanese}</td>
              <td className="px-4 py-2">{sentence.english}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SentenceTable;