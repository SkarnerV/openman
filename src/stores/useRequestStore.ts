import { create } from "zustand";

export interface QueryParam {
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
}

export interface HttpRequest {
  id: string;
  name: string;
  description?: string;
  method: HttpMethod;
  url: string;
  params?: QueryParam[];
  headers: Header[];
  body?: RequestBody;
  auth?: AuthConfig;
  preRequestScript?: string;
  testScript?: string;
  lastResponse?: HttpResponse;
  createdAt: string;
  updatedAt: string;
}

export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | "HEAD"
  | "OPTIONS";

export interface Header {
  key: string;
  value: string;
  description?: string;
  enabled: boolean;
}

export type BodyType =
  | "none"
  | "json"
  | "xml"
  | "form-data"
  | "x-www-form-urlencoded"
  | "raw"
  | "binary";

export interface RequestBody {
  mode: BodyType;
  content: string;
  rawLanguage?: "json" | "xml" | "html" | "text";
}

export type AuthConfig =
  | { type: "none" }
  | { type: "bearer"; token: string }
  | { type: "basic"; username: string; password: string }
  | { type: "api-key"; key: string; value: string; addTo: "header" | "query" };

export interface HttpResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  responseTime: number;
  responseSize: number;
}

interface RequestState {
  currentRequest: Partial<HttpRequest> | null;
  response: HttpResponse | null;
  isLoading: boolean;
  error: string | null;
  requestHistory: HttpRequest[];
  // Track the source of the current request (for update vs save new)
  sourceCollectionId: string | null;
  sourceRequestId: string | null;
  setCurrentRequest: (request: Partial<HttpRequest> | null) => void;
  updateCurrentRequest: (updates: Partial<HttpRequest>) => void;
  setResponse: (response: HttpResponse | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addToHistory: (request: HttpRequest) => void;
  clearHistory: () => void;
  setSourceContext: (collectionId: string | null, requestId: string | null) => void;
  clearSourceContext: () => void;
}

export const useRequestStore = create<RequestState>((set) => ({
  currentRequest: null,
  response: null,
  isLoading: false,
  error: null,
  requestHistory: [],
  sourceCollectionId: null,
  sourceRequestId: null,
  setCurrentRequest: (request) => set({ currentRequest: request }),
  updateCurrentRequest: (updates) =>
    set((state) => ({
      currentRequest: state.currentRequest
        ? { ...state.currentRequest, ...updates }
        : updates,
    })),
  setResponse: (response) => set({ response }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  addToHistory: (request) =>
    set((state) => ({
      requestHistory: [request, ...state.requestHistory].slice(0, 100), // Keep last 100
    })),
  clearHistory: () => set({ requestHistory: [] }),
  setSourceContext: (collectionId, requestId) =>
    set({ sourceCollectionId: collectionId, sourceRequestId: requestId }),
  clearSourceContext: () => set({ sourceCollectionId: null, sourceRequestId: null }),
}));
