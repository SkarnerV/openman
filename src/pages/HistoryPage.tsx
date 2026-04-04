import { useState } from "react";
import { Search, Trash2, Clock, Filter } from "lucide-react";
import { useRequestStore, type HttpRequest } from "../stores/useRequestStore";
import { useNavigate } from "react-router-dom";

export function HistoryPage() {
  const { requestHistory, clearHistory, setCurrentRequest, setResponse, setError } = useRequestStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const navigate = useNavigate();

  const getMethodColor = (method: string) => {
    switch (method) {
      case "GET":
        return "text-get-method";
      case "POST":
        return "text-post-method";
      case "PUT":
        return "text-put-method";
      case "PATCH":
        return "text-put-method";
      case "DELETE":
        return "text-delete-method";
      default:
        return "text-text-secondary";
    }
  };

  const filteredHistory = requestHistory.filter((r) => {
    const matchesSearch =
      r.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMethod = methodFilter === "all" || r.method === methodFilter;
    return matchesSearch && matchesMethod;
  });

  // Group by date
  const groupedHistory = filteredHistory.reduce((acc, request) => {
    const date = new Date(request.createdAt).toDateString();
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(request);
    return acc;
  }, {} as Record<string, HttpRequest[]>);

  const sortedDates = Object.keys(groupedHistory).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  const formatUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname + urlObj.search;
    } catch {
      return url;
    }
  };

  const handleRequestClick = (request: HttpRequest) => {
    // Load the request into the store and navigate to request builder
    setCurrentRequest(request);
    setResponse(request.lastResponse || null);
    setError(null);
    navigate("/request");
  };

  // True Empty State
  if (requestHistory.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-card-bg flex items-center justify-center mx-auto mb-6">
            <Clock className="w-8 h-8 text-text-secondary" />
          </div>
          <h2 className="text-xl font-semibold mb-2 font-display">
            No History Yet
          </h2>
          <p className="text-text-secondary mb-6">
            Your request history will appear here once you start making API calls.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-8 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold font-display">History</h1>
        {requestHistory.length > 0 && (
          <button
            onClick={clearHistory}
            className="flex items-center gap-2 px-3 py-2 text-delete-method hover:bg-delete-method/10 rounded-radius transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Clear All
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search history..."
            className="w-full pl-12 pr-4 py-3 bg-card-bg rounded-radius text-sm focus:outline-none focus:ring-2 focus:ring-accent-orange"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-text-secondary" />
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="px-4 py-3 bg-card-bg rounded-radius text-sm focus:outline-none"
          >
            <option value="all">All Methods</option>
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
            <option value="DELETE">DELETE</option>
          </select>
        </div>
      </div>

      {/* History List */}
      {filteredHistory.length === 0 ? (
        <div className="text-center py-12 text-text-secondary">
          No history found matching your filters
        </div>
      ) : (
        <div className="space-y-6">
          {sortedDates.map((date) => (
            <div key={date}>
              <h3 className="text-sm font-semibold text-text-secondary mb-3">
                {date === new Date().toDateString()
                  ? "Today"
                  : date ===
                      new Date(Date.now() - 86400000).toDateString()
                    ? "Yesterday"
                    : date}
              </h3>
              <div className="space-y-1">
                {groupedHistory[date].map((request) => (
                  <div
                    key={request.id}
                    onClick={() => handleRequestClick(request)}
                    className="flex items-center gap-3 p-3 bg-card-bg rounded-radius hover:bg-elevated-bg cursor-pointer transition-colors"
                  >
                    <span
                      className={`font-mono text-sm font-semibold w-16 ${getMethodColor(request.method)}`}
                    >
                      {request.method}
                    </span>
                    <span className="flex-1 truncate text-sm">
                      {formatUrl(request.url)}
                    </span>
                    <span className="text-xs text-text-secondary">
                      {new Date(request.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
