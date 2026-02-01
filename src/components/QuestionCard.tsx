'use client';

import { Heart } from 'lucide-react';

interface QuestionCardProps {
  question: {
    id: number;
    question: string;
    options: string[];
  };
  selectedAnswer: number | undefined;
  onSelect: (index: number) => void;
  questionNumber: number;
}

export default function QuestionCard({ question, selectedAnswer, onSelect, questionNumber }: QuestionCardProps) {
  return (
    <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-8 md:p-12 shadow-2xl border border-pink-200 glow">
      <div className="mb-8">
        <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-pink-100 to-rose-100 px-4 py-2 rounded-full mb-4">
          <Heart className="w-4 h-4 text-pink-600 fill-pink-600" />
          <span className="text-pink-700 font-medium">
            Question {questionNumber}
          </span>
        </div>
        <h3 className="text-2xl md:text-3xl font-semibold text-rose-900 leading-relaxed">
          {question.question}
        </h3>
      </div>

      <div className="space-y-4">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => onSelect(index)}
            className={`w-full text-left p-6 rounded-2xl transition-all duration-300 ${
              selectedAnswer === index
                ? 'bg-gradient-to-r from-pink-50 to-rose-50 border-2 border-pink-400 transform scale-[1.02] shadow-lg'
                : 'bg-pink-50/50 border border-pink-200 hover:bg-pink-100/50 hover:border-pink-300'
            }`}
          >
            <div className="flex items-center space-x-4">
              <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                selectedAnswer === index
                  ? 'bg-pink-500 text-white'
                  : 'bg-white text-pink-500'
              }`}>
                {String.fromCharCode(65 + index)}
              </div>
              <span className="text-lg text-rose-800">{option}</span>
              {selectedAnswer === index && (
                <div className="ml-auto">
                  <Heart className="w-5 h-5 text-pink-500 fill-pink-500" />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}