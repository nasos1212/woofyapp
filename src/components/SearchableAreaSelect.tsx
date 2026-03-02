import { useState, useRef, useCallback } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface SearchableAreaSelectProps {
  areas: string[];
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
}

const SearchableAreaSelect = ({
  areas,
  value,
  onValueChange,
  placeholder = "Select area (optional)",
}: SearchableAreaSelectProps) => {
  const [open, setOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.stopPropagation();
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value || <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <Command>
          <CommandInput placeholder="Search area..." />
          <div
            onTouchMove={handleTouchMove}
            onWheel={(e) => e.stopPropagation()}
          >
            <CommandList
              ref={listRef}
              className="max-h-[40vh]"
              style={{ touchAction: 'pan-y', overscrollBehavior: 'contain' }}
            >
              <CommandEmpty>No area found.</CommandEmpty>
              <CommandGroup>
                {areas.map((area) => (
                  <CommandItem
                    key={area}
                    value={area}
                    onSelect={() => {
                      onValueChange(area === value ? "" : area);
                      setOpen(false);
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === area ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {area}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default SearchableAreaSelect;
