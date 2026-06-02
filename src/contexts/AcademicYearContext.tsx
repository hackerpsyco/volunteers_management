import React, { createContext, useContext, useState, useEffect } from 'react';

type AcademicYear = '2025-26' | '2026-27' | '2027-28';

interface AcademicYearContextType {
  selectedYear: AcademicYear;
  setSelectedYear: (year: AcademicYear) => void;
  getDateRange: () => { startDate: Date; endDate: Date };
}

const AcademicYearContext = createContext<AcademicYearContextType | undefined>(undefined);

export function AcademicYearProvider({ children }: { children: React.ReactNode }) {
  // Default to 2026-27
  const [selectedYear, setSelectedYear] = useState<AcademicYear>(() => {
    const saved = localStorage.getItem('selectedAcademicYear_v2');
    return (saved as AcademicYear) || '2026-27';
  });

  useEffect(() => {
    localStorage.setItem('selectedAcademicYear_v2', selectedYear);
  }, [selectedYear]);

  const getDateRange = () => {
    const [startYearStr] = selectedYear.split('-');
    const startYear = parseInt(startYearStr);
    
    // Academic year: June 1st to May 31st
    const startDate = new Date(startYear, 5, 1); // June is month 5 (0-indexed)
    const endDate = new Date(startYear + 1, 4, 31, 23, 59, 59); // May is month 4
    
    return { startDate, endDate };
  };

  return (
    <AcademicYearContext.Provider value={{ selectedYear, setSelectedYear, getDateRange }}>
      {children}
    </AcademicYearContext.Provider>
  );
}

export function useAcademicYear() {
  const context = useContext(AcademicYearContext);
  if (context === undefined) {
    throw new Error('useAcademicYear must be used within an AcademicYearProvider');
  }
  return context;
}
