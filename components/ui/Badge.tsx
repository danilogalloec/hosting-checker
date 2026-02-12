import { clsx } from 'clsx';
import { ValidationLevel } from '@/lib/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: ValidationLevel | 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  const variantClasses: Record<string, string> = {
    PASS: 'bg-green-100 text-green-800 border-green-200',
    WARNING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    ERROR: 'bg-red-100 text-red-800 border-red-200',
    INFO: 'bg-blue-100 text-blue-800 border-blue-200',
    default: 'bg-gray-100 text-gray-800 border-gray-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
      variantClasses[variant],
      className
    )}>
      {children}
    </span>
  );
}
