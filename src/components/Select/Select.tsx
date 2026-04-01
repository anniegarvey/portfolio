"use client";

import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { styled } from "next-yak";
import React from "react";

// biome-ignore lint/style/useComponentExportOnlyModules: primitive export
export const Select = SelectPrimitive.Root;

// biome-ignore lint/style/useComponentExportOnlyModules: primitive export
export const SelectGroup = SelectPrimitive.Group;

// biome-ignore lint/style/useComponentExportOnlyModules: primitive export
export const SelectValue = SelectPrimitive.Value;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ children, ...props }, ref) => (
  <StyledTrigger ref={ref} {...props}>
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown size={16} style={{ opacity: 0.5 }} />
    </SelectPrimitive.Icon>
  </StyledTrigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <StyledContent position={position} ref={ref} {...props}>
      <StyledScrollUpButton>
        <ChevronUp size={16} />
      </StyledScrollUpButton>
      <SelectPrimitive.Viewport
        style={{
          padding: "5px",
        }}
      >
        {children}
      </SelectPrimitive.Viewport>
      <StyledScrollDownButton>
        <ChevronDown size={16} />
      </StyledScrollDownButton>
    </StyledContent>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

export const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className, ...props }, ref) => <StyledLabel ref={ref} {...props} />);
SelectLabel.displayName = SelectPrimitive.Label.displayName;

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ children, ...props }, ref) => (
  <StyledItem ref={ref} {...props}>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    <StyledItemIndicator>
      <Check size={16} />
    </StyledItemIndicator>
  </StyledItem>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

export const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => <StyledSeparator ref={ref} {...props} />);
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

// Styles

const StyledTrigger = styled(SelectPrimitive.Trigger)`
  display: inline-flex;
  align-items: center;
  justify-content: space-between;
  border-radius: 6px; // Using slightly larger radius for modern look
  padding: 0 12px;
  font-size: 0.9rem;
  line-height: 1;
  height: 36px;
  gap: 8px;
  background-color: light-dark(white, var(--color-grey-700)); // Dark mode bg
  color: light-dark(var(--color-grey-900), var(--color-grey-100)); // Dark mode text
  border: 1px solid light-dark(var(--color-grey-300), var(--color-grey-600)); // Border capable of contrast
  
  &:hover {
    background-color: light-dark(var(--color-grey-50), var(--color-grey-600));
  }
  
  &:focus {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 1px;
  }
  
  &[data-placeholder] {
    color: var(--color-grey-500);
  }
`;

const StyledContent = styled(SelectPrimitive.Content)`
  overflow: hidden;
  background-color: light-dark(white, var(--color-grey-800));
  border-radius: 6px;
  box-shadow: var(--elevation-md);
  border: 1px solid light-dark(var(--color-grey-200), var(--color-grey-700));
  z-index: 50; // Ensure it stays on top
`;

const StyledLabel = styled(SelectPrimitive.Label)`
  padding: 0 25px;
  font-size: 12px;
  line-height: 25px;
  color: var(--color-grey-500);
`;

const StyledItem = styled(SelectPrimitive.Item)`
  font-size: 0.9rem;
  line-height: 1;
  color: light-dark(var(--color-grey-900), var(--color-grey-100));
  border-radius: 4px;
  display: flex;
  align-items: center;
  height: 32px;
  padding: 0 32px 0 24px;
  position: relative;
  user-select: none;

  &[data-disabled] {
    color: var(--color-grey-400);
    pointer-events: none;
  }

  &[data-highlighted] {
    outline: none;
    background-color: var(--color-primary-600);
    color: white;
  }
`;

const StyledItemIndicator = styled(SelectPrimitive.ItemIndicator)`
  position: absolute;
  left: 4px;
  width: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
`;

const StyledSeparator = styled(SelectPrimitive.Separator)`
  height: 1px;
  background-color: var(--color-grey-200);
  margin: 5px;
`;

const StyledScrollUpButton = styled(SelectPrimitive.ScrollUpButton)`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 25px;
  background-color: light-dark(white, var(--color-grey-800));
  color: var(--color-primary-600);
  cursor: default;
`;

const StyledScrollDownButton = styled(SelectPrimitive.ScrollDownButton)`
  display: flex;
  align-items: center;
  justify-content: center;
  height: 25px;
  background-color: light-dark(white, var(--color-grey-800));
  color: var(--color-primary-600);
  cursor: default;
`;
