'use client';

import { useState, FormEvent } from 'react';
import { Search } from 'lucide-react';
import { clsx } from 'clsx';
import { useRouter } from 'next/navigation';
import { sanitizeDomain } from '@/lib/utils/validators';

interface SearchFormProps {
  onSubmit?: (domain: string) => void;
  initialValue?: string;
  autoFocus?: boolean;
  className?: string;
}

export function SearchForm({ onSubmit, initialValue = '', autoFocus = false, className }: SearchFormProps) {
  const [domain, setDomain] = useState(initialValue);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar dominio
    const trimmed = domain.trim();
    if (!trimmed) {
      setError('Please enter a domain name');
      return;
    }

    // Sanitizar dominio
    const sanitized = sanitizeDomain(trimmed);

    if (!sanitized) {
      setError('Invalid domain format');
      return;
    }

    setIsLoading(true);

    try {
      if (onSubmit) {
        onSubmit(sanitized);
      } else {
        // Navegar a página de resultados
        router.push(`/results/${encodeURIComponent(sanitized)}`);
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={clsx('w-full', className)}>
      <div className="flex flex-col gap-2">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={domain}
            onChange={(e) => {
              setDomain(e.target.value);
              setError('');
            }}
            placeholder="Enter domain name (e.g., google.com)"
            className={clsx(
              'block w-full pl-12 pr-4 py-4 text-lg',
              'border-2 rounded-lg',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent',
              'transition-all duration-200',
              error ? 'border-red-500' : 'border-gray-300',
              isLoading && 'opacity-50 cursor-not-allowed'
            )}
            disabled={isLoading}
            autoFocus={autoFocus}
          />
        </div>

        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className={clsx(
            'w-full py-4 px-6 text-lg font-semibold rounded-lg',
            'bg-primary text-white',
            'hover:bg-primary/90 active:bg-primary/80',
            'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
            'transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            isLoading && 'relative'
          )}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              Analyzing...
            </span>
          ) : (
            'Analyze Domain'
          )}
        </button>

        <p className="text-sm text-gray-600 text-center">
          Enter a domain without http:// or www
        </p>
      </div>
    </form>
  );
}
