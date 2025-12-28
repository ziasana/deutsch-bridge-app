"use client";

import {createContext, useCallback, useContext, useEffect, useMemo, useState} from "react";

const DarkModeContext = createContext({
  darkMode: false,
  toggle: () => {},
});

export function DarkModeProvider({ children }: Readonly<{ children: React.ReactNode }>) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);


  const toggle = useCallback(() => {
    setDarkMode(prev => !prev);
  }, []);
  const value = useMemo(() => ({ darkMode, toggle }), [darkMode, toggle]);

 return (
    <DarkModeContext.Provider value={value}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  return useContext(DarkModeContext);
}
