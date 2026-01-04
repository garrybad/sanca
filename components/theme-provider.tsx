"use client"
import { ThemeProvider as NextThemesProvider, type ThemeProviderProps, useTheme as useNextTheme } from "next-themes"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem {...props}>
      {children}
    </NextThemesProvider>
  )
}

export function useTheme() {
  const context = useNextTheme()

  return {
    theme: context.theme,
    toggleTheme: () => {
      context.setTheme(context.theme === "light" ? "dark" : "light")
    },
  }
}
