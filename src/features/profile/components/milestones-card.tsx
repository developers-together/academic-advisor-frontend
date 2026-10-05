import {
  Trophy,
  Medal,
  Flag,
  Rocket,
  GraduationCap,
  CircleCheck,
  type LucideIcon,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/utils/cn';

export type MilestoneKey =
  | 'first_step'
  | 'plan_architect'
  | 'approved'
  | 'level_cleared'
  | 'halfway'
  | 'map_mastered';

export type Milestone = {
  key: MilestoneKey;
  earned: boolean;
  hint: string | null;
};

const ICONS: Record<MilestoneKey, LucideIcon> = {
  first_step: CircleCheck,
  plan_architect: Flag,
  approved: Rocket,
  level_cleared: GraduationCap,
  halfway: Medal,
  map_mastered: Trophy,
};

export type MilestonesCardProps = {
  milestones: Milestone[];
  className?: string;
};

export const MilestonesCard = ({
  milestones,
  className,
}: MilestonesCardProps) => {
  const { t } = useTranslation('plan');
  const earned = milestones.filter((milestone) => milestone.earned).length;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{t('milestones.title')}</CardTitle>
        <p className="text-xs text-muted-foreground tabular-nums">
          {t('milestones.score', { earned, total: milestones.length })}
        </p>
      </CardHeader>
      <CardBody>
        <ul className="grid gap-2 sm:grid-cols-2">
          {milestones.map((milestone) => {
            const Icon = ICONS[milestone.key];
            return (
              <li
                key={milestone.key}
                aria-current={milestone.earned ? 'true' : undefined}
                className={cn(
                  'flex items-start gap-3 rounded-lg border p-3 transition-shadow hover:shadow-xs',
                  milestone.earned
                    ? 'border-success/30 bg-success/10'
                    : 'border-border bg-muted/40',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'flex size-9 shrink-0 items-center justify-center rounded-full',
                    milestone.earned
                      ? 'bg-success text-success-foreground'
                      : 'bg-muted text-muted-foreground',
                  )}
                >
                  <Icon className="size-4.5" aria-hidden />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">
                    {t(`milestones.items.${milestone.key}`)}
                  </span>
                  <span
                    className={cn(
                      'mt-0.5 block text-xs',
                      milestone.earned
                        ? 'text-success'
                        : 'text-muted-foreground',
                    )}
                  >
                    {milestone.earned
                      ? t('milestones.earned')
                      : (milestone.hint ?? t('milestones.pending'))}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      </CardBody>
    </Card>
  );
};

MilestonesCard.displayName = 'MilestonesCard';
