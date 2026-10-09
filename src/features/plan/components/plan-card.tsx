import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { PlanStateChip } from '@/components/domain/plan-state-chip';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { paths } from '@/config/paths';
import type { Plan, PlanStatus } from '@/types/domain';

type CtaConfig =
  { kind: 'link'; labelKey: string; href: string } | { kind: 'none' };

const ctaFor = (status: PlanStatus): CtaConfig => {
  switch (status) {
    case 'draft':
      return {
        kind: 'link',
        labelKey: 'dashboard.cta.draft',
        href: paths.app.builder.getHref(),
      };
    case 'submitted':
    case 'under_review':
      return {
        kind: 'link',
        labelKey: 'dashboard.cta.submitted',
        href: paths.app.plan.getHref(),
      };
    case 'returned':
      return {
        kind: 'link',
        labelKey: 'dashboard.cta.returned',
        href: paths.app.plan.getHref(),
      };
    case 'discarded':
      return {
        kind: 'link',
        labelKey: 'dashboard.cta.discarded',
        href: paths.app.builder.getHref(),
      };
    default:
      return { kind: 'none' };
  }
};

const contextLineFor = (
  status: PlanStatus,
  advisorName: string | null,
): { key: string; values?: Record<string, string> } => {
  switch (status) {
    case 'draft':
      return { key: 'dashboard.context.draft' };
    case 'submitted':
      return advisorName
        ? {
            key: 'dashboard.context.submitted',
            values: { advisor: advisorName },
          }
        : { key: 'dashboard.context.submittedFallback' };
    case 'under_review':
      return { key: 'dashboard.context.under_review' };
    case 'returned':
      return { key: 'dashboard.context.returned' };
    case 'approved':
      return { key: 'dashboard.context.approved' };
    case 'expired':
      return { key: 'dashboard.context.expired' };
    case 'closed':
      return { key: 'dashboard.context.closed' };
    case 'withdrawn':
      return { key: 'dashboard.context.withdrawn' };
    case 'discarded':
      return { key: 'dashboard.context.discarded' };
  }
};

export type PlanCardProps = {
  plan: Plan;
};

export const PlanCard = ({ plan }: PlanCardProps) => {
  const { t } = useTranslation('plan');
  const cta = ctaFor(plan.status);
  const context = contextLineFor(plan.status, null);

  return (
    <Card className="h-full">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div>
          <CardTitle>{t('termContext', { term: plan.term_code })}</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {t(context.key, context.values)}
          </p>
        </div>
        <PlanStateChip status={plan.status} />
      </CardHeader>
      <CardBody className="pt-0">
        <p className="text-sm text-muted-foreground">
          {t('dashboard.courseCount', { count: plan.courses.length })}
        </p>
        {plan.courses.length > 0 && (
          <ul className="mt-4 divide-y">
            {plan.courses.slice(0, 3).map((course) => (
              <li
                key={course.course_code}
                className="flex items-start justify-between gap-4 py-3"
              >
                <div className="min-w-0">
                  <span className="bidi-code text-sm font-semibold">
                    {course.course_code}
                  </span>
                  {course.title && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {course.title}
                    </p>
                  )}
                </div>
                <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                  {t('builder.line.credits', { credits: course.credits })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
      {cta.kind === 'link' && (
        <CardFooter className="pt-0">
          <Button asChild className="h-11">
            <Link to={cta.href}>{t(cta.labelKey)}</Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};
