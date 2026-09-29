import * as React from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

interface Option {
  label: string;
  value: string;
}

interface MultiSelectProps {
  options?: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options = [],
  selected,
  onChange,
  placeholder = "انتخاب کنید",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = React.useState(false);

  const selectedLabels = selected
    .map((v) => options.find((o) => o.value === v)?.label)
    .filter(Boolean);

  const displayText =
    selectedLabels.length > 0 ? selectedLabels.join("، ") : placeholder;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            !selectedLabels.length && "text-muted-foreground",
            className,
          )}
        >
          <span className="truncate">{displayText}</span>
          <ChevronDown className="h-4 w-4 opacity-50 shrink-0 mr-2" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[var(--radix-dropdown-menu-trigger-width)]"
        align="start"
      >
        {options.map((opt) => {
          const checked = selected.includes(opt.value);
          return (
            <DropdownMenuCheckboxItem
              key={opt.value}
              checked={checked}
              onSelect={(e) => {
                e.preventDefault();
                if (checked) {
                  onChange(selected.filter((v) => v !== opt.value));
                } else {
                  onChange([...selected, opt.value]);
                }
              }}
            >
              {opt.label}
            </DropdownMenuCheckboxItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
