import { ButtonHTMLAttributes, FC } from 'react';
import { cn } from '@/lib/utils/cn';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'ghost' | 'danger';
  size?: 'default' | 'small' | 'large';
}

export const Button: FC<ButtonProps> = ({
  className,
  variant = 'default',
  size = 'default',
  children,
  ...props
}) => {
  return (
    <button
      className={cn(
        'font-semibold rounded-[10px] cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis transition-all',
        {
          'bg-[--panel] border border-[#2a334d] text-[--text] hover:border-[#3a4768]': variant === 'default',
          'bg-[#1d2844] border border-[#324067] text-[#dbe6ff] hover:bg-[#253254]': variant === 'primary',
          'bg-transparent border border-[#2a334d] text-[--text] hover:bg-[rgba(255,255,255,0.05)]': variant === 'ghost',
          'bg-[--danger] border border-[--danger] text-white hover:bg-[#ff6480]': variant === 'danger',
          'px-[10px] py-2': size === 'default',
          'px-2 py-1 text-xs': size === 'small',
          'px-4 py-3 text-lg': size === 'large',
        },
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
};