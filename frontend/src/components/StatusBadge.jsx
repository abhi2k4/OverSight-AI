export default function StatusBadge({ status, size = 'md' }) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  }

  const statusConfig = {
    active: {
      bg: 'bg-status-success-bg',
      text: 'text-status-success',
      label: 'Active',
    },
    inactive: {
      bg: 'bg-text-tertiary/10',
      text: 'text-text-secondary',
      label: 'Inactive',
    },
    warning: {
      bg: 'bg-status-warning-bg',
      text: 'text-status-warning',
      label: 'Warning',
    },
    critical: {
      bg: 'bg-status-danger-bg',
      text: 'text-status-danger',
      label: 'Critical',
    },
    resolved: {
      bg: 'bg-status-success-light',
      text: 'text-status-success',
      label: 'Resolved',
    },
    investigating: {
      bg: 'bg-status-info-bg',
      text: 'text-primary',
      label: 'Investigating',
    },
    acknowledged: {
      bg: 'bg-status-warning-light',
      text: 'text-status-warning',
      label: 'Acknowledged',
    },
  }

  const config = statusConfig[status.toLowerCase()] || statusConfig.active

  return (
    <span
      className={`
        inline-flex items-center justify-center
        font-medium rounded-full
        ${config.bg} ${config.text} ${sizeClasses[size]}
      `}
    >
      {config.label}
    </span>
  )
}
