import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, CheckCircle, XCircle, Shuffle } from 'lucide-react';

interface PuzzleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSolved: () => void;
}

type PuzzleType = 'math' | 'pattern' | 'riddle';

interface Puzzle {
  id: number;
  type: PuzzleType;
  question: string;
  answer: string | number;
  options?: string[];
  hint?: string;
  visual?: React.ReactNode;
}

const mathPuzzles: Puzzle[] = [
  {
    id: 1,
    type: 'math',
    question: 'What is 15 + 27?',
    answer: 42,
    hint: 'Add the numbers together'
  },
  {
    id: 2,
    type: 'math',
    question: 'What is 8 × 7?',
    answer: 56,
    hint: 'Multiply the numbers'
  },
  {
    id: 3,
    type: 'math',
    question: 'What is 100 - 37?',
    answer: 63,
    hint: 'Subtract 37 from 100'
  },
  {
    id: 4,
    type: 'math',
    question: 'What is 144 ÷ 12?',
    answer: 12,
    hint: 'Divide 144 by 12'
  },
  {
    id: 5,
    type: 'math',
    question: 'What comes next in the sequence: 2, 4, 8, 16, ?',
    answer: 32,
    hint: 'Each number doubles the previous one'
  }
];

const patternPuzzles: Puzzle[] = [
  {
    id: 6,
    type: 'pattern',
    question: 'Complete the pattern: 🔴🔵🔴🔵🔴?',
    answer: '🔵',
    options: ['🔴', '🔵', '🟡', '🟢'],
    hint: 'Look at the alternating pattern'
  },
  {
    id: 7,
    type: 'pattern',
    question: 'What comes next: ⭐⭐⭐🌙⭐⭐⭐🌙⭐⭐⭐?',
    answer: '🌙',
    options: ['⭐', '🌙', '☀️', '🌟'],
    hint: 'Count the stars before each moon'
  },
  {
    id: 8,
    type: 'pattern',
    question: 'Complete: 🍎🍌🍎🍌🍎?',
    answer: '🍌',
    options: ['🍎', '🍌', '🍊', '🍇'],
    hint: 'Simple alternating pattern'
  },
  {
    id: 14,
    type: 'pattern',
    question: 'What comes next: 🐶🐱🐶🐱🐶?',
    answer: '🐱',
    options: ['🐶', '🐱', '🐭', '🐹'],
    hint: 'Dog and cat pattern'
  },
  {
    id: 15,
    type: 'pattern',
    question: 'Complete: 🌞🌙🌞🌙🌞?',
    answer: '🌙',
    options: ['🌞', '🌙', '⭐', '🌟'],
    hint: 'Day and night pattern'
  }
];

const riddlePuzzles: Puzzle[] = [
  {
    id: 9,
    type: 'riddle',
    question: 'I have keys but no locks. I have space but no room. You can enter, but not outside. What am I?',
    answer: 'keyboard',
    hint: 'You use this to type'
  },
  {
    id: 10,
    type: 'riddle',
    question: 'What has hands but cannot clap?',
    answer: 'clock',
    hint: 'It tells time'
  },
  {
    id: 11,
    type: 'riddle',
    question: 'What gets wet while drying?',
    answer: 'towel',
    hint: 'Used after a bath'
  },
  {
    id: 12,
    type: 'riddle',
    question: 'What goes up but never comes down?',
    answer: 'age',
    hint: 'It increases with time'
  },
  {
    id: 13,
    type: 'riddle',
    question: 'What can travel around the world while staying in a corner?',
    answer: 'stamp',
    hint: 'Found on letters'
  }
];

const allPuzzles = [...mathPuzzles, ...patternPuzzles, ...riddlePuzzles];

export const PuzzleModal: React.FC<PuzzleModalProps> = ({
  isOpen,
  onClose,
  onSolved
}) => {
  const [currentPuzzle, setCurrentPuzzle] = useState<Puzzle | null>(null);
  const [userAnswer, setUserAnswer] = useState('');
  const [showHint, setShowHint] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Select a random puzzle when modal opens
      const randomPuzzle = allPuzzles[Math.floor(Math.random() * allPuzzles.length)];
      setCurrentPuzzle(randomPuzzle);
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setUserAnswer('');
    setShowHint(false);
    setIsCorrect(null);
    setShowResult(false);
  };

  const checkAnswer = () => {
    if (!currentPuzzle) return;

    const userAnswerNormalized = userAnswer.toLowerCase().trim();
    const correctAnswer = currentPuzzle.answer.toString().toLowerCase();

    const correct = userAnswerNormalized === correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setTimeout(() => {
        onSolved();
        onClose();
      }, 1500);
    }
  };

  const generateNewPuzzle = () => {
    const randomPuzzle = allPuzzles[Math.floor(Math.random() * allPuzzles.length)];
    setCurrentPuzzle(randomPuzzle);
    resetState();
  };

  const handleSkip = () => {
    onClose();
  };

  if (!currentPuzzle) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleSkip}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            🧩 Fun Break Time!
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSkip}
              className="ml-auto h-6 w-6"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            You've been working hard! Here's a quick brain teaser to refresh your mind. 🌟
          </DialogDescription>
        </DialogHeader>

        <Card className="w-full">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="capitalize">
                {currentPuzzle.type} Puzzle
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={generateNewPuzzle}
                className="h-8 px-2"
              >
                <Shuffle className="h-4 w-4" />
                New Puzzle
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p className="text-lg font-medium mb-4">
                {currentPuzzle.question}
              </p>
            </div>

            {currentPuzzle.options ? (
              <div className="grid grid-cols-2 gap-2">
                {currentPuzzle.options.map((option, index) => (
                  <Button
                    key={index}
                    variant={userAnswer === option ? "default" : "outline"}
                    onClick={() => setUserAnswer(option)}
                    className="h-12 text-lg"
                    disabled={showResult}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            ) : (
              <Input
                placeholder="Enter your answer..."
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
                disabled={showResult}
                className="text-center text-lg"
              />
            )}

            {showResult && (
              <div className={`flex items-center justify-center gap-2 p-3 rounded-lg ${
                isCorrect 
                  ? 'bg-green-50 text-green-700 border border-green-200' 
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {isCorrect ? (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Correct! Well done! 🎉</span>
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5" />
                    <span className="font-medium">
                      Not quite right. The answer is: {currentPuzzle.answer}
                    </span>
                  </>
                )}
              </div>
            )}

            {showHint && currentPuzzle.hint && !showResult && (
              <div className="bg-blue-50 text-blue-700 p-3 rounded-lg border border-blue-200">
                <p className="text-sm">
                  <strong>Hint:</strong> {currentPuzzle.hint}
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {!showResult && (
                <>
                  <Button
                    onClick={checkAnswer}
                    disabled={!userAnswer.trim()}
                    className="flex-1"
                  >
                    Check Answer
                  </Button>
                  {currentPuzzle.hint && !showHint && (
                    <Button
                      variant="outline"
                      onClick={() => setShowHint(true)}
                    >
                      Hint
                    </Button>
                  )}
                </>
              )}
              
              {showResult && !isCorrect && (
                <Button
                  onClick={generateNewPuzzle}
                  variant="outline"
                  className="flex-1"
                >
                  Try Another Puzzle
                </Button>
              )}
              
              <Button
                variant="ghost"
                onClick={handleSkip}
                className={showResult && isCorrect ? "flex-1" : ""}
              >
                {showResult && isCorrect ? "Continue" : "Skip"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};