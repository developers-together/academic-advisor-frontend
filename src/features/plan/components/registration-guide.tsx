import {
  BookOpen,
  Check,
  ExternalLink,
  ListChecks,
  ShieldCheck,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import type { Plan } from '@/types/domain';

export const RegistrationGuide = ({ plan }: { plan: Plan }) => {
  const { t } = useTranslation('plan');
  const approved = plan.status === 'approved';
  const steps = [
    {
      icon: BookOpen,
      title: t('registration.build'),
      done: plan.status !== 'draft' && plan.status !== 'discarded',
    },
    {
      icon: ShieldCheck,
      title: t('registration.review'),
      done: approved || plan.status === 'closed',
    },
    { icon: ListChecks, title: t('registration.register'), done: false },
  ];
  return (
    <Card>
      <CardHeader>
        <h2 className="text-base font-semibold">{t('registration.title')}</h2>
        <ol
          className="mt-3 flex flex-wrap gap-x-6 gap-y-3"
          aria-label={t('registration.steps')}
        >
          {steps.map(({ icon: Icon, title, done }) => (
            <li key={title} className="flex items-center gap-2 text-sm">
              {done ? (
                <Check
                  className="size-4 text-state-approved-foreground"
                  aria-hidden
                />
              ) : (
                <Icon className="size-4 text-muted-foreground" aria-hidden />
              )}
              <span>{title}</span>
              {done && (
                <span className="sr-only">{t('registration.done')}</span>
              )}
            </li>
          ))}
        </ol>
      </CardHeader>
      <CardBody className="space-y-4 pt-0">
        <p className="max-w-prose text-sm text-muted-foreground">
          {approved
            ? t('registration.approved')
            : plan.status === 'draft'
              ? t('registration.beforeApproval')
              : t(
                  `dashboard.context.${plan.status === 'submitted' ? 'submittedFallback' : plan.status}`,
                )}
        </p>
        {approved && (
          <>
            <ol className="list-decimal space-y-2 ps-5 text-sm">
              <li>{t('registration.checkCourses')}</li>
              <li>{t('registration.chooseSections')}</li>
              <li>{t('registration.checkSIS')}</li>
            </ol>
            <Button asChild>
              <a
                href="https://sis.ejust.edu.eg/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="me-2 size-4" aria-hidden />
                {t('registration.openSIS')}
              </a>
            </Button>
          </>
        )}
      </CardBody>
    </Card>
  );
};
