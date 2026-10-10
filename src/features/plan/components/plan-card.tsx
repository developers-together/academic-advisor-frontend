import { ArrowRight, BookOpen } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { PlanStateChip } from '@/components/domain/plan-state-chip';
import { Button } from '@/components/ui/button';
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
    <article className="home-plan">
      <div className="home-plan-stage">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-base font-medium">
            {t('termContext', { term: plan.term_code })}
          </h2>
          <PlanStateChip status={plan.status} />
        </div>
        <p className="home-plan-message">{t(context.key, context.values)}</p>
        <div className="mt-7 flex flex-wrap items-center gap-4">
          {cta.kind === 'link' ? (
            <Button asChild className="home-plan-action">
              <Link to={cta.href}>
                {t(cta.labelKey)}
                <ArrowRight
                  className="ms-3 size-4 rtl:-scale-x-100"
                  aria-hidden
                />
              </Link>
            </Button>
          ) : null}
          <span className="text-sm">
            {t('dashboard.courseCount', { count: plan.courses.length })}
          </span>
        </div>
      </div>
      <div className="home-course-ledger">
        <div className="mb-2 flex items-center justify-between gap-3">
          <h3 className="inline-flex items-center gap-2 text-sm font-semibold">
            <BookOpen className="size-4" aria-hidden />
            {t('myPlan.title')}
          </h3>
          <Link to={paths.app.plan.getHref()} className="home-text-link">
            {t('redesign.viewPlan')}
            <ArrowRight className="size-4 rtl:-scale-x-100" aria-hidden />
          </Link>
        </div>
        {plan.courses.length > 0 ? (
          <ul className="divide-y">
            {plan.courses.slice(0, 3).map((course) => (
              <li
                key={course.course_code}
                className="flex items-center gap-4 py-4"
              >
                <span className="bidi-code min-w-20 text-sm font-semibold">
                  {course.course_code}
                </span>
                <span className="min-w-0 flex-1 text-sm text-muted-foreground">
                  {course.title ?? ''}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {course.credits == null
                    ? t('builder.line.creditsUnknown')
                    : t('builder.line.credits', { credits: course.credits })}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-4 text-sm text-muted-foreground">
            {t('redesign.noCourses')}
          </p>
        )}
        {plan.courses.length > 3 && (
          <p className="mt-2 text-xs text-muted-foreground">
            {t('redesign.moreCourses', { count: plan.courses.length - 3 })}
          </p>
        )}
      </div>
    </article>
  );
};
