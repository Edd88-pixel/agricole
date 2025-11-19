import { createContext, useContext } from 'react';
import { useSupabaseData, type SupabaseDataContext } from '@/hooks/useSupabaseData';

const DataContext = createContext<SupabaseDataContext | undefined>(undefined);

type Props = {
  children: React.ReactNode;
};

export const DataProvider = ({ children }: Props) => {
  const value = useSupabaseData();
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within DataProvider');
  }
  return context;
};
