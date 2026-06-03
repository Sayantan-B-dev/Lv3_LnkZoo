"use client";

import React, { createContext, useContext, useState, useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

interface LoadingContextType {
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

// Separate component to listen to navigation changes inside a Suspense boundary
function NavigationListener() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { setIsLoading } = useLoading();

  useEffect(() => {
    setIsLoading(false);
  }, [pathname, searchParams, setIsLoading]);

  return null;
}

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  // Global click listener to catch navigations early
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      
      if (anchor && 
          anchor.href && 
          anchor.href.startsWith(window.location.origin) && 
          !anchor.href.includes("#") &&
          anchor.target !== "_blank" &&
          !anchor.getAttribute("download")) {
        
        // Only trigger for real navigations, not same-page hashes
        const currentPath = window.location.pathname;
        const targetPath = new URL(anchor.href).pathname;
        
        if (currentPath !== targetPath) {
          setIsLoading(true);
          
          // Safety timeout: reset loading if navigation takes too long or fails
          clearTimeout(timeout);
          timeout = setTimeout(() => setIsLoading(false), 8000);
        }
      }
    };

    window.addEventListener("click", handleGlobalClick);
    return () => {
      window.removeEventListener("click", handleGlobalClick);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <LoadingContext.Provider value={{ isLoading, setIsLoading }}>
      <Suspense fallback={null}>
        <NavigationListener />
      </Suspense>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  const context = useContext(LoadingContext);
  if (context === undefined) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}