import { useEffect, useState } from "react";

export function useTauri() {
  const [isReady, setIsReady] = useState(false);
  const [isTauri, setIsTauri] = useState(false);

  useEffect(() => {
    // Check if running in Tauri environment
    const checkTauri = async () => {
      try {
        const { isTauri: isTauriApp } = await import("@tauri-apps/api/core");
        const result = await isTauriApp();
        setIsTauri(result);
        setIsReady(true);
      } catch {
        setIsTauri(false);
        setIsReady(true);
      }
    };
    checkTauri();
  }, []);

  return { isReady, isTauri };
}
