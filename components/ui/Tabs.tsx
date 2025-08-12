import { FC, ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

interface TabsProps {
  value: string;
  onValueChange: (value: string) => void;
  children: ReactNode;
}

interface TabListProps {
  children: ReactNode;
}

interface TabProps {
  value: string;
  children: ReactNode;
  onClick?: () => void;
}

interface TabContentProps {
  value: string;
  children: ReactNode;
}

export const Tabs: FC<TabsProps> & {
  List: FC<TabListProps>;
  Tab: FC<TabProps>;
  Content: FC<TabContentProps>;
} = ({ children }) => {
  return <div>{children}</div>;
};

const TabList: FC<TabListProps> = ({ children }) => {
  return (
    <div className="flex bg-[#121521] border-b border-[#1f2535]">
      {children}
    </div>
  );
};

const Tab: FC<TabProps> = ({ value, children, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex-1 px-3 py-2 bg-transparent border-none text-[--muted] font-semibold',
        'cursor-pointer border-b-2 border-transparent transition-all',
        'hover:bg-[rgba(255,255,255,0.02)]'
      )}
      data-value={value}
    >
      {children}
    </button>
  );
};

const TabContent: FC<TabContentProps> = ({ children }) => {
  return <div>{children}</div>;
};

Tabs.List = TabList;
Tabs.Tab = Tab;
Tabs.Content = TabContent;