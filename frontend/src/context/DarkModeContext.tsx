import { createContext, useContext, ReactNode, useEffect } from "react";
import { useLocalStorageState } from "../hooks/useLocalStorageState";

// Define the type of the context value
interface DarkModeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
}

// Create the context with a default value of undefined
const DarkModeContext = createContext<DarkModeContextType | undefined>(
  undefined
);

// Define the provider component
function DarkModeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useLocalStorageState<boolean>(
    "isDarkMode",
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  useEffect(() => {
    const sparkles = document.querySelectorAll(
      ".sparkle-1, .sparkle-2, .sparkle-3"
    );

    if (isDarkMode) {
      document.documentElement.classList.add("dark-mode");
      document.documentElement.classList.remove("light-mode");

      // Re-add sparkles if they were removed
      if (sparkles.length === 0) {
        const sparkleContainer = document.body;
        ["sparkle-1", "sparkle-2", "sparkle-3"].forEach((className) => {
          const sparkle = document.createElement("div");
          sparkle.classList.add(className);
          sparkleContainer.appendChild(sparkle);
        });
      }
    } else {
      document.documentElement.classList.remove("dark-mode");
      document.documentElement.classList.add("light-mode");

      // Remove sparkles in light mode
      sparkles.forEach((sparkle) => sparkle.remove());
    }
  }, [isDarkMode]);

  function toggleDarkMode() {
    setIsDarkMode((isDark) => !isDark);
  }

  return (
    <DarkModeContext.Provider value={{ isDarkMode, toggleDarkMode }}>
      {children}
    </DarkModeContext.Provider>
  );
}

// Create a custom hook for consuming the context
function useDarkMode() {
  const context = useContext(DarkModeContext);
  if (context === undefined) {
    throw new Error("DarkModeContext must be used within a DarkModeProvider");
  }
  return context;
}

export { DarkModeProvider, useDarkMode };
