import * as React from "react";
import {
  Control,
  Controller,
  FieldPath,
  FieldValues,
  RegisterOptions,
} from "react-hook-form";
import { DatePickerProps } from "@mantine/dates";
import { MyDatePicker } from "./MyDatePicker";

type FormDatePickerProps<
  TFieldValues extends FieldValues
> = Omit<DatePickerProps, "value" | "onChange" | "minDate" | "maxDate"> & {
  minDate?: string;
  maxDate?: string;
  control: Control<TFieldValues>;
  name: FieldPath<TFieldValues>;
  label?: React.ReactNode;
  description?: React.ReactNode;
  placeholder?: string;
  clearable?: boolean;
  disabled?: boolean;
  required?: boolean;
  rules?: RegisterOptions<TFieldValues, FieldPath<TFieldValues>>;
  className?: string;
  inputClassName?: string;
};

export function FormDatePicker<TFieldValues extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  clearable,
  disabled,
  required,
  rules,
  className,
  inputClassName,
  ...datePickerProps
}: FormDatePickerProps<TFieldValues>) {
  return (
    <Controller
      control={control}
      name={name}
      rules={rules}
      render={({ field, fieldState }) => (
        <MyDatePicker
          {...datePickerProps}
          value={field.value ?? null}
          onChange={field.onChange}
          onBlur={field.onBlur}
          label={label}
          description={description}
          placeholder={placeholder}
          clearable={clearable}
          disabled={disabled}
          required={required}
          error={fieldState.error?.message}
          className={className}
          inputClassName={inputClassName}
        />
      )}
    />
  );
}