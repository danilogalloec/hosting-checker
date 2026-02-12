import { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  icon?: ReactNode;
  className?: string;
  loading?: boolean;
  error?: string;
}

export function Card({ children, title, subtitle, icon, className, loading, error }: CardProps) {
  return (
    <div className={clsx(
      'bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden',
      'transition-all duration-200 hover:shadow-lg',
      className
    )}>
      {(title || icon) && (
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center gap-3">
            {icon && <div className="text-primary">{icon}</div>}
            <div className="flex-1">
              {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="px-6 py-8 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-primary"></div>
            <p className="mt-2 text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      ) : error ? (
        <div className="px-6 py-4 bg-red-50 border-l-4 border-red-500">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      ) : (
        <div className="px-6 py-4">
          {children}
        </div>
      )}
    </div>
  );
}

interface CardRowProps {
  label: string;
  value: ReactNode;
  mono?: boolean;
}

export function CardRow({ label, value, mono }: CardRowProps) {
  return (
    <div className="flex justify-between items-start py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-gray-600">{label}</span>
      <span className={clsx(
        'text-sm text-gray-900 text-right',
        mono && 'font-mono'
      )}>
        {value}
      </span>
    </div>
  );
}
