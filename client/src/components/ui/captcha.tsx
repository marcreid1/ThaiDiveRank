import { useState, useEffect } from "react";
import { Input } from "./input";
import { Label } from "./label";
import { RefreshCw } from "lucide-react";
import { Button } from "./button";

interface CaptchaProps {
  onVerify: (isValid: boolean) => void;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}

export function Captcha({ onVerify, value, onChange, error }: CaptchaProps) {
  const [num1, setNum1] = useState(0);
  const [num2, setNum2] = useState(0);
  const [operator, setOperator] = useState('+');
  const [correctAnswer, setCorrectAnswer] = useState(0);

  const generateCaptcha = () => {
    const n1 = Math.floor(Math.random() * 10) + 1;
    const n2 = Math.floor(Math.random() * 10) + 1;
    const ops = ['+', '-', '*'];
    const op = ops[Math.floor(Math.random() * ops.length)];
    
    let answer = 0;
    switch (op) {
      case '+':
        answer = n1 + n2;
        break;
      case '-':
        answer = n1 - n2;
        break;
      case '*':
        answer = n1 * n2;
        break;
    }
    
    setNum1(n1);
    setNum2(n2);
    setOperator(op);
    setCorrectAnswer(answer);
    
    // Clear the input when generating new captcha
    onChange('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  useEffect(() => {
    const userAnswer = parseInt(value);
    if (!isNaN(userAnswer)) {
      const isCorrect = userAnswer === correctAnswer;
      onVerify(isCorrect);
    } else {
      onVerify(false);
    }
  }, [value, correctAnswer, onVerify]);

  return (
    <div className="space-y-2">
      <Label htmlFor="captcha">Security Check</Label>
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-1 text-lg font-mono bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded border">
          <span>{num1}</span>
          <span>{operator}</span>
          <span>{num2}</span>
          <span>=</span>
          <span>?</span>
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={generateCaptcha}
          className="shrink-0"
          title="Generate new captcha"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>
      <Input
        id="captcha"
        type="number"
        placeholder="Enter the answer"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={error ? "border-red-500" : ""}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}