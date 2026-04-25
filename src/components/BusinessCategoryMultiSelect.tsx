import { useTranslation } from "react-i18next";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { businessCategories } from "@/data/businessCategories";
import { useBusinessCategoryLabel } from "@/hooks/useBusinessCategoryLabel";

interface BusinessCategoryMultiSelectProps {
  selected: string[];
  onChange: (categories: string[]) => void;
  label?: string;
  required?: boolean;
}

const BusinessCategoryMultiSelect = ({
  selected,
  onChange,
  label,
  required = false,
}: BusinessCategoryMultiSelectProps) => {
  const { t } = useTranslation();
  const { label: getCategoryLabel } = useBusinessCategoryLabel();
  const displayLabel = label ?? t("businessCategoriesField.defaultLabel");
  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((c) => c !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div className="space-y-3">
      <Label>
        {label} {required && "*"}
      </Label>

      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((cat) => {
            const option = businessCategories.find((c) => c.value === cat);
            return (
              <Badge key={cat} variant="secondary" className="pl-2 pr-1 py-1 flex items-center gap-1">
                {option?.label || cat}
                <button
                  type="button"
                  onClick={() => toggle(cat)}
                  className="ml-0.5 hover:bg-muted rounded-full p-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 border rounded-lg p-3">
        {businessCategories.map((cat) => (
          <label
            key={cat.value}
            className="flex items-center gap-2 text-sm cursor-pointer p-1.5 rounded hover:bg-muted/50"
          >
            <Checkbox
              checked={selected.includes(cat.value)}
              onCheckedChange={() => toggle(cat.value)}
              className="data-[state=checked]:bg-primary"
            />
            {cat.label}
          </label>
        ))}
      </div>

      {required && selected.length === 0 && (
        <p className="text-xs text-muted-foreground italic">
          Select at least one category
        </p>
      )}
    </div>
  );
};

export default BusinessCategoryMultiSelect;
