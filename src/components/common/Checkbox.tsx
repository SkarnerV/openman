import { Check } from "lucide-react";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({ checked, onChange, label, disabled = false, className = "" }: CheckboxProps) {
  return (
    <label className={`inline-flex items-center gap-3 cursor-pointer ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => !disabled && onChange(!checked)}
        className={`w-5 h-5 flex items-center justify-center rounded transition-all ${
          checked
            ? "bg-accent-orange"
            : "bg-elevated-bg border border-elevated-bg hover:border-accent-orange"
        }`}
      >
        {checked && <Check className="w-3 h-3 text-text-on-accent" />}
      </button>
      {label && <span className="text-sm text-text-primary">{label}</span>}
    </label>
  );
}