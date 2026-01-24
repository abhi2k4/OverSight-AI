export default function MetricCard({ title, value, trend, icon: Icon, color = 'primary' }) {
  const colorClasses = {
    primary: 'text-primary bg-primary/10',
    success: 'text-status-success bg-status-success-bg',
    warning: 'text-status-warning bg-status-warning-bg',
    danger: 'text-status-danger bg-status-danger-bg',
    info: 'text-primary-light bg-status-info-bg',
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-card hover:shadow-card-hover transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-text-secondary text-sm font-medium mb-2">{title}</p>
          <p className="text-text-primary text-3xl font-semibold mb-1">{value}</p>
          {trend && (
            <p className="text-xs text-text-tertiary">
              {trend.direction === 'up' ? '↑' : '↓'}{' '}
              <span className={trend.direction === 'up' ? 'text-status-success' : 'text-status-danger'}>
                {trend.value}
              </span>{' '}
              {trend.label}
            </p>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
            <Icon size={24} stroke={2} />
          </div>
        )}
      </div>
    </div>
  )
}
