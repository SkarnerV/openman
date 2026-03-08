import { useCallback } from "react";
import { useRequestStore } from "../stores";
import { sendHttpRequest } from "../services/httpService";
import type { HttpRequest, HttpResponse } from "../stores";

export function useHttp() {
  const {
    currentRequest,
    response,
    isLoading,
    error,
    setResponse,
    setLoading,
    setError,
    addToHistory,
  } = useRequestStore();

  const sendRequest = useCallback(
    async (request: HttpRequest) => {
      setLoading(true);
      setError(null);
      setResponse(null);

      try {
        const result = await sendHttpRequest(request);
        setResponse(result as HttpResponse);
        addToHistory(request);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Request failed");
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setError, setResponse, addToHistory],
  );

  return {
    currentRequest,
    response,
    isLoading,
    error,
    sendRequest,
  };
}
