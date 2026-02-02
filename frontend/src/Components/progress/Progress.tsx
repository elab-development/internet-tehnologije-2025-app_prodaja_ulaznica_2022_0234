import { useState, useEffect } from 'react';

interface ProgressProps {
  ms: number;
}

const Progress: React.FC<ProgressProps> = ({ ms }) => {
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + 50 / (ms / 100);
        return newProgress >= 100 ? 100 : newProgress;
      });
    }, 50);

    setTimeout(() => {
      clearInterval(interval);
    }, ms);

    return () => {
      clearInterval(interval);
    };
  }, [ms]);

  return (
    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
      <div 
        className="bg-blue-600 h-full transition-all duration-100 ease-linear rounded-full" 
        style={{ width: `${progress}%` }} 
      />
    </div>
  );
};

export default Progress;