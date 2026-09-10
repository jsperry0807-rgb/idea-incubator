import { useTranslation } from "react-i18next";
import { ShareRole, SHARE_ROLE_VALUES } from "@repo/shared";

const INVITED_ROLES = SHARE_ROLE_VALUES.filter(
  (role) => role !== ShareRole.OWNER,
);

export interface AccessRoleSelectProps {
  value: ShareRole;
  onChange: (role: ShareRole) => void;
  disabled?: boolean;
  ariaLabel: string;
  className?: string;
}

export function AccessRoleSelect({
  value,
  onChange,
  disabled,
  ariaLabel,
  className,
}: AccessRoleSelectProps) {
  const { t } = useTranslation();

  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value as ShareRole)}
      disabled={disabled}
      aria-label={ariaLabel}
      className={[
        "rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-bg)] px-2.5 py-1.5 text-sm text-[var(--color-fg)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)]",
        "disabled:pointer-events-none disabled:opacity-50",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {INVITED_ROLES.map((role) => (
        <option key={role} value={role}>
          {t(`ideas.sharing.role.${role}`)}
        </option>
      ))}
    </select>
  );
}