"use client";

import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";

type BaseFieldProps = {
  label?: string;
  description?: string;
  error?: string;
  children: ReactNode;
};

type AppInputProps =
  InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    description?: string;
    error?: string;
  };

type AppTextareaProps =
  TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
    description?: string;
    error?: string;
  };

type AppSelectProps =
  SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    description?: string;
    error?: string;
    children: ReactNode;
  };

function FieldWrapper({
  label,
  description,
  error,
  children,
}: BaseFieldProps) {
  return (
    <div>
      {label && (
        <label className="block mb-2 font-medium">
          {label}
        </label>
      )}

      {children}

      {description && !error && (
        <p className="text-sm text-zinc-500 mt-2">
          {description}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 mt-2">
          {error}
        </p>
      )}
    </div>
  );
}

function getFieldClassName(
  className = "",
  hasError = false
) {
  return `w-full border rounded-2xl px-5 py-4 outline-none bg-white transition ${
    hasError
      ? "border-red-300 focus:border-red-500"
      : "border-zinc-200 focus:border-zinc-500"
  } ${className}`;
}

export function AppInput({
  label,
  description,
  error,
  className = "",
  ...props
}: AppInputProps) {
  return (
    <FieldWrapper
      label={label}
      description={description}
      error={error}
    >
      <input
        className={getFieldClassName(
          className,
          Boolean(error)
        )}
        {...props}
      />
    </FieldWrapper>
  );
}

export function AppTextarea({
  label,
  description,
  error,
  className = "",
  rows = 5,
  ...props
}: AppTextareaProps) {
  return (
    <FieldWrapper
      label={label}
      description={description}
      error={error}
    >
      <textarea
        rows={rows}
        className={getFieldClassName(
          `resize-none ${className}`,
          Boolean(error)
        )}
        {...props}
      />
    </FieldWrapper>
  );
}

export function AppSelect({
  label,
  description,
  error,
  className = "",
  children,
  ...props
}: AppSelectProps) {
  return (
    <FieldWrapper
      label={label}
      description={description}
      error={error}
    >
      <select
        className={getFieldClassName(
          className,
          Boolean(error)
        )}
        {...props}
      >
        {children}
      </select>
    </FieldWrapper>
  );
}

export default FieldWrapper;