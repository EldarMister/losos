"use client";

import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

type Props = {
  value: string;
  options: { value: string; label: string }[];
  onValueChange: (value: string) => void;
  id?: string;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  "aria-label"?: string;
};

export function AdminSelect({ value, options, onValueChange, id, name, disabled, required, className, "aria-label": label }: Props) {
  return <Select value={value} items={options} name={name} disabled={disabled} required={required} onValueChange={next => { if (next !== null) onValueChange(next); }}>
    <SelectTrigger id={id} aria-label={label} className={`w-full ${className || ""}`}><SelectValue /></SelectTrigger>
    <SelectContent alignItemWithTrigger={false} align="start"><SelectGroup>
      {options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
    </SelectGroup></SelectContent>
  </Select>;
}
