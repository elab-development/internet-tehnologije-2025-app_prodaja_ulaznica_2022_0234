import { useEffect } from 'react';
import useAlert from '../../hooks/useAlert';
import Progress from '../progress/Progress';

const Alert: React.FC = () => {
  const { alert, hideAlert } = useAlert();

  useEffect(() => {
    if (alert.show) {
      const timeout = setTimeout(() => {
        hideAlert();
      }, 7000);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [alert.show, hideAlert]);

  if (!alert.show) return null;

  const alertColors: Record<string, string> = {
    success: 'bg-green-500 text-white',
    error: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white',
    info: 'bg-blue-500 text-white',
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
      <div className={`${alertColors[alert.type] || 'bg-blue-500 text-white'} rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden`}>
        <div className="flex items-center justify-between p-4">
          <p className="flex-1 font-medium">{alert.text}</p>
          <button 
            type="button" 
            onClick={hideAlert}
            className="ml-4 hover:opacity-70 transition"
          >
            <span className="text-2xl leading-none">×</span>
          </button>
        </div>
        <Progress ms={7000} />
      </div>
    </div>
  );
};

export default Alert;