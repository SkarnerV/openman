import { beforeEach, describe, expect, it } from "vitest";
import { useRequestStore } from "./useRequestStore";

describe("useRequestStore", () => {
  beforeEach(() => {
    useRequestStore.setState({
      currentRequest: null,
      response: null,
      isLoading: false,
      error: null,
      requestHistory: [],
      sourceCollectionId: null,
      sourceRequestId: null,
    });
  });

  describe("setCurrentRequest", () => {
    it("sets the current request", () => {
      const request = {
        id: "req-1",
        name: "Get Users",
        method: "GET" as const,
        url: "https://api.example.com/users",
        headers: [],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      useRequestStore.getState().setCurrentRequest(request);

      expect(useRequestStore.getState().currentRequest).toEqual(request);
    });

    it("can set current request to null", () => {
      useRequestStore.setState({
        currentRequest: {
          id: "req-1",
          name: "Test",
          method: "GET" as const,
          url: "https://example.com",
          headers: [],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      });

      useRequestStore.getState().setCurrentRequest(null);

      expect(useRequestStore.getState().currentRequest).toBeNull();
    });
  });

  describe("updateCurrentRequest", () => {
    it("updates the current request with partial data", () => {
      useRequestStore.setState({
        currentRequest: {
          id: "req-1",
          name: "Get Users",
          method: "GET" as const,
          url: "https://api.example.com/users",
          headers: [],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        },
      });

      useRequestStore.getState().updateCurrentRequest({ name: "Updated Name" });

      expect(useRequestStore.getState().currentRequest?.name).toBe("Updated Name");
      expect(useRequestStore.getState().currentRequest?.method).toBe("GET");
    });

    it("sets partial request when current request is null", () => {
      useRequestStore.getState().updateCurrentRequest({ url: "https://example.com" });

      expect(useRequestStore.getState().currentRequest?.url).toBe("https://example.com");
    });
  });

  describe("setResponse", () => {
    it("sets the response", () => {
      const response = {
        status: 200,
        statusText: "OK",
        headers: { "content-type": "application/json" },
        body: '{"success": true}',
        responseTime: 100,
        responseSize: 50,
      };

      useRequestStore.getState().setResponse(response);

      expect(useRequestStore.getState().response).toEqual(response);
    });

    it("can set response to null", () => {
      useRequestStore.setState({
        response: {
          status: 200,
          statusText: "OK",
          headers: {},
          body: "{}",
          responseTime: 100,
          responseSize: 50,
        },
      });

      useRequestStore.getState().setResponse(null);

      expect(useRequestStore.getState().response).toBeNull();
    });
  });

  describe("setLoading", () => {
    it("sets the loading state", () => {
      useRequestStore.getState().setLoading(true);
      expect(useRequestStore.getState().isLoading).toBe(true);

      useRequestStore.getState().setLoading(false);
      expect(useRequestStore.getState().isLoading).toBe(false);
    });
  });

  describe("setError", () => {
    it("sets the error", () => {
      useRequestStore.getState().setError("Something went wrong");
      expect(useRequestStore.getState().error).toBe("Something went wrong");
    });

    it("can clear the error", () => {
      useRequestStore.setState({ error: "Error" });
      useRequestStore.getState().setError(null);
      expect(useRequestStore.getState().error).toBeNull();
    });
  });

  describe("addToHistory", () => {
    it("adds a request to the history", () => {
      const request = {
        id: "req-1",
        name: "Get Users",
        method: "GET" as const,
        url: "https://api.example.com/users",
        headers: [],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      useRequestStore.getState().addToHistory(request);

      expect(useRequestStore.getState().requestHistory).toHaveLength(1);
      expect(useRequestStore.getState().requestHistory[0]).toEqual(request);
    });

    it("prepends to the history", () => {
      const request1 = {
        id: "req-1",
        name: "Request 1",
        method: "GET" as const,
        url: "https://api.example.com/1",
        headers: [],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };
      const request2 = {
        id: "req-2",
        name: "Request 2",
        method: "POST" as const,
        url: "https://api.example.com/2",
        headers: [],
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      };

      useRequestStore.getState().addToHistory(request1);
      useRequestStore.getState().addToHistory(request2);

      expect(useRequestStore.getState().requestHistory[0]).toEqual(request2);
      expect(useRequestStore.getState().requestHistory[1]).toEqual(request1);
    });

    it("limits history to 100 items", () => {
      for (let i = 0; i < 150; i++) {
        useRequestStore.getState().addToHistory({
          id: `req-${i}`,
          name: `Request ${i}`,
          method: "GET" as const,
          url: `https://api.example.com/${i}`,
          headers: [],
          createdAt: "2024-01-01T00:00:00Z",
          updatedAt: "2024-01-01T00:00:00Z",
        });
      }

      expect(useRequestStore.getState().requestHistory).toHaveLength(100);
      // Most recent should be first
      expect(useRequestStore.getState().requestHistory[0].id).toBe("req-149");
    });
  });

  describe("clearHistory", () => {
    it("clears all history", () => {
      useRequestStore.setState({
        requestHistory: [
          {
            id: "req-1",
            name: "Request 1",
            method: "GET" as const,
            url: "https://api.example.com/1",
            headers: [],
            createdAt: "2024-01-01T00:00:00Z",
            updatedAt: "2024-01-01T00:00:00Z",
          },
        ],
      });

      useRequestStore.getState().clearHistory();

      expect(useRequestStore.getState().requestHistory).toHaveLength(0);
    });
  });

  describe("setSourceContext", () => {
    it("sets the source context", () => {
      useRequestStore.getState().setSourceContext("col-1", "req-1");

      expect(useRequestStore.getState().sourceCollectionId).toBe("col-1");
      expect(useRequestStore.getState().sourceRequestId).toBe("req-1");
    });
  });

  describe("clearSourceContext", () => {
    it("clears the source context", () => {
      useRequestStore.setState({
        sourceCollectionId: "col-1",
        sourceRequestId: "req-1",
      });

      useRequestStore.getState().clearSourceContext();

      expect(useRequestStore.getState().sourceCollectionId).toBeNull();
      expect(useRequestStore.getState().sourceRequestId).toBeNull();
    });
  });
});