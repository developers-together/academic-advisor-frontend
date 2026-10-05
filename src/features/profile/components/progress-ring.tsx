import { useTranslation } from 'react-i18next';

import { cn } from '@/utils/cn';

export type ProgressRingProps = {
  /** 0..1 completed share. */
  value: number;
  size?: number;
  label?: string;
  className?: string;
};

export const ProgressRing = ({
  value,
  size = 72,
  label,
  className,
}: ProgressRingProps) => {
  const { t } = useTranslation('plan');
  const clamped = Math.max(0, Math.min(1, value));
  const stroke = 7;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - clamped);

  return (
    <div
      role="img"
      aria-label={
        label ?? t('progressRing.label', { percent: Math.round(clamped * 100) })
      }
      className={cn(
        'relative inline-flex items-center justify-center',
        className,
      )}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          className="stroke-muted"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="stroke-primary motion-safe:transition-[stroke-dashoffset] motion-safe:duration-700 motion-safe:ease-out"
        />
      </svg>
      <span className="absolute text-sm font-bold tabular-nums">
        {Math.round(clamped * 100)}%
      </span>
    </div>
  );
};

ProgressRing.displayName = 'ProgressRing';
