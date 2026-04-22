import { useTranslation } from "react-i18next";
import { businessCategories, getCategoryLabel } from "@/data/businessCategories";

export const useBusinessCategoryLabel = () => {
  const { t } = useTranslation();

  const label = (value: string | null | undefined): string => {
    if (!value) return "";
    const fallback = getCategoryLabel(value);
    return t(`businessCategories.${value}`, { defaultValue: fallback });
  };

  const labels = (values: string[] | null | undefined): string => {
    if (!values || values.length === 0) return "N/A";
    return values.map(label).join(", ");
  };

  const options = businessCategories.map((c) => ({
    value: c.value,
    label: label(c.value),
  }));

  return { label, labels, options };
};
