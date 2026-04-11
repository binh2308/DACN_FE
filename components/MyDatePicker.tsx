import { forwardRef, useMemo, useRef, useState } from "react";
import { Popover } from "@mantine/core";
import { DatePicker, DatePickerProps } from "@mantine/dates";
import { CalendarDays } from "lucide-react";
import dayjs from "dayjs";

import { Input } from "@/components/ui/input";
type MyDatePickerProps = Omit<
  DatePickerProps,
  "value" | "onChange"
> & {
  value: string | null;
  onChange: (value: string | null) => void;
  onBlur?: () => void;
  label?: React.ReactNode;
  description?: React.ReactNode;
  error?: React.ReactNode;
  placeholder?: string;
  clearable?: boolean;
  className?: string;
  inputClassName?: string;
  minDate?: string;
  maxDate?: string;
  disabled?: boolean;
  required?: boolean;
};

export const MyDatePicker = forwardRef<HTMLInputElement, MyDatePickerProps>(
  (
    {
      value,
      onChange,
      onBlur,
      label,
      description,
      error,
      placeholder = "dd/mm/yyyy",
      clearable = true,
      className,
      inputClassName,
      minDate,
      maxDate,
      disabled,
      required,
      ...datePickerProps
    },
    ref
  ) => {
  const [opened, setOpened] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayValue = useMemo(() => {
    return value ? dayjs(value).format("DD/MM/YYYY") : "";
  }, [value]);

  return (
    <Popover
      opened={opened}
      onChange={setOpened}
      position="bottom-start"
      withArrow
      shadow="md"
      zIndex={9999}
    >
      <Popover.Target>
        <div className="relative">
          <Input
            ref={inputRef}
            value={displayValue}
            placeholder={placeholder}
            readOnly
            disabled={disabled}
            className={className}
            onClick={() => !disabled && setOpened(true)}
            onFocus={() => !disabled && setOpened(true)}
          />
          <div className="absolute inset-y-0 right-2 flex items-center gap-1">
            <CalendarDays size={16} className="text-muted-foreground" />
          </div>
        </div>
      </Popover.Target>

      <Popover.Dropdown p={0} style={{ pointerEvents: "auto" }}>
        <DatePicker
          value={value}
          onChange={(date) => {
            onChange(date);
            if (date) {
              setOpened(false);
            }
          }}
          allowDeselect
          minDate={minDate}
          maxDate={maxDate}
        />
      </Popover.Dropdown>
    </Popover>
  );
});
