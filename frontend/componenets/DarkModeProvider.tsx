"use client";

import { createContext, useContext, useEffect, useState } from "react";

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

  const toggle = () => setDarkMode((prev) => !prev);

  return (
    <DarkModeContext.Provider value={{ darkMode, toggle }}>
      {children}
    </DarkModeContext.Provider>
  );
}

export function useDarkMode() {
  return useContext(DarkModeContext);
}
