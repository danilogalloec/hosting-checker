import { AlertCircle, X } from 'lucide-react';
import { clsx } from 'clsx';

interface ErrorAlertProps {
  message: string;
  onClose?: () => void;
  className?: string;
}

export function ErrorAlert({ message, onClose, className }: ErrorAlertProps) {
  return (
    <div className={clsx(
      'bg-red-50 border-l-4 border-red-500 p-4 rounded',
      'flex items-start gap-3',
      className
    )}>
      <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm text-red-800">{message}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 text-red-500 hover:text-red-700 transition-colors"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
