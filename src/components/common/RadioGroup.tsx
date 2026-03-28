import { Circle } from "lucide-react";

interface RadioGroupProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}

export function RadioGroup({ value, onChange, options, className = "" }: RadioGroupProps) {
  return (
    <div className={`flex gap-4 ${className}`}>
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <div
            className={`w-5 h-5 flex items-center justify-center rounded-full border-2 transition-all ${
              value === option.value
                ? "border-accent-orange"
                : "border-elevated-bg hover:border-accent-orange/50"
            }`}
          >
            {value === option.value && (
              <Circle className="w-2.5 h-2.5 fill-accent-orange text-accent-orange" />
            )}
          </div>
          <span className="text-sm">{option.label}</span>
        </button>
      ))}
    </div>
  );
}