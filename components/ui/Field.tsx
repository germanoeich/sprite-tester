import { InputHTMLAttributes, FC } from 'react';
import { cn } from '@/lib/utils/cn';

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Field: FC<FieldProps> = ({
  className,
  label,
  id,
  ...props
}) => {
  const fieldId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  return (
    <div className="flex items-center gap-2">
      {label && (
        <label htmlFor={fieldId} className="text-[--muted] text-xs">
          {label}
        </label>
      )}
      <input
        id={fieldId}
        className={cn(
          'bg-[--panel-2] border border-[#2a334d] text-[--text] px-2 py-1.5 rounded-lg',
          'focus:outline-none focus:border-[--accent] transition-colors',
          className
        )}
        {...props}
      />
    </div>
  );
};