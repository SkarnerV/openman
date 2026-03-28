import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface MethodSelectProps {
  value: string;
  onChange: (value: string) => void;
}

const methods = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];

const getMethodColor = (method: string) => {
  switch (method) {
    case "GET":
      return "bg-get-method text-text-on-accent";
    case "POST":
      return "bg-post-method text-text-on-accent";
    case "PUT":
    case "PATCH":
      return "bg-put-method text-text-on-accent";
    case "DELETE":
      return "bg-delete-method text-text-on-accent";
    default:
      return "bg-text-secondary text-text-primary";
  }
};

export function MethodSelect({ value, onChange }: MethodSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center justify-between gap-2 px-4 py-3 rounded-radius font-semibold font-mono text-sm ${getMethodColor(value)} cursor-pointer`}
      >
        <span>{value}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-card-bg border border-elevated-bg rounded-radius shadow-lg z-50 overflow-hidden min-w-[120px]">
          {methods.map((method) => (
            <button
              key={method}
              onClick={() => {
                onChange(method);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-elevated-bg transition-colors"
            >
              <span className={`font-mono font-semibold ${getMethodColor(method).split(" ")[0]}`}>
                {method}
              </span>
              {value === method && (
                <Check className="w-4 h-4 text-accent-orange" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}