import { Tooltip } from '@heroui/react';

interface FieldLabelProps {
  label: string;
  description?: string;
  required?: boolean;
  htmlFor?: string;
}

export function FieldLabel({ label, description, required, htmlFor }: FieldLabelProps) {
  return (
    <div className="mb-1 flex items-center gap-1.5">
      <label
        htmlFor={htmlFor}
        className="text-xs font-medium text-text-secondary"
      >
        {label}
        {required && <span aria-hidden="true" className="ml-0.5 text-error">*</span>}
      </label>
      {description && (
        <Tooltip delay={0}>
          <Tooltip.Trigger>
            <span className="inline-flex h-3.5 w-3.5 cursor-help items-center justify-center rounded-full border border-text-muted text-[9px] leading-none text-text-muted transition-colors hover:border-accent hover:text-accent">
              ?
            </span>
          </Tooltip.Trigger>
          <Tooltip.Content showArrow offset={4}>
            <Tooltip.Arrow />
            <span className="max-w-[220px] text-xs">{description}</span>
          </Tooltip.Content>
        </Tooltip>
      )}
    </div>
  );
}
