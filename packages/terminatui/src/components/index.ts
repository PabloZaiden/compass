import React from "react";

/**
 * Box component props
 */
export interface BoxProps {
  children?: React.ReactNode;
  flexDirection?: "row" | "column";
  padding?: number;
  margin?: number;
  borderStyle?: "single" | "double" | "round" | "none";
}

/**
 * Box component for layout
 */
export function Box({ children }: BoxProps) {
  return React.createElement("div", null, children);
}

/**
 * Text component props
 */
export interface TextProps {
  children?: React.ReactNode;
  color?: string;
  bold?: boolean;
  dim?: boolean;
}

/**
 * Text component for styled text
 */
export function Text({ children }: TextProps) {
  return React.createElement("span", null, children);
}

/**
 * Input component props
 */
export interface InputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Input component
 */
export function Input({ value, onChange, placeholder }: InputProps) {
  return React.createElement("input", {
    value,
    onChange: (e: { target: { value: string } }) => onChange(e.target.value),
    placeholder,
  });
}

/**
 * Select option
 */
export interface SelectOption {
  label: string;
  value: string;
}

/**
 * Select component props
 */
export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange: (value: string) => void;
}

/**
 * Select component
 */
export function Select({ options, value, onChange }: SelectProps) {
  return React.createElement(
    "select",
    { value, onChange: (e: { target: { value: string } }) => onChange(e.target.value) },
    options.map((opt) =>
      React.createElement("option", { key: opt.value, value: opt.value }, opt.label)
    )
  );
}

/**
 * Button component props
 */
export interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
}

/**
 * Button component
 */
export function Button({ label, onPress, disabled }: ButtonProps) {
  return React.createElement("button", { onClick: onPress, disabled }, label);
}

/**
 * Modal component props
 */
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/**
 * Modal component
 */
export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return React.createElement(
    "div",
    { className: "modal" },
    React.createElement(
      "div",
      { className: "modal-content" },
      title && React.createElement("h2", null, title),
      children,
      React.createElement("button", { onClick: onClose }, "Close")
    )
  );
}

/**
 * Spinner component props
 */
export interface SpinnerProps {
  label?: string;
}

/**
 * Spinner component
 */
export function Spinner({ label }: SpinnerProps) {
  return React.createElement("span", null, label ?? "Loading...");
}
