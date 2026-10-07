import { GraduationCap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { ContentLayout } from '@/components/layouts';
import { Card } from '@/components/ui/card';
import { paths } from '@/config/paths';

const tasks = [
  {
    to: paths.admin.assignments.getHref(),
    labelKey: 'nav.assignments',
    hintKey: 'operations.items.assignments',
  },
  {
    to: paths.admin.courses.getHref(),
    labelKey: 'nav.courses',
    hintKey: 'operations.items.courses',
  },
  {
    to: paths.admin.programs.getHref(),
    labelKey: 'nav.programs',
    hintKey: 'operations.items.programs',
  },
  {
    to: paths.admin.rules.getHref(),
    labelKey: 'nav.rules',
    hintKey: 'operations.items.rules',
  },
  {
    to: paths.admin.registrationWindows.getHref(),
    labelKey: 'nav.registrationWindows',
    hintKey: 'operations.items.registrationWindows',
  },
  {
    to: paths.admin.academics.getHref(),
    labelKey: 'nav.academics',
    hintKey: 'operations.items.academics',
  },
  {
    to: paths.admin.notifications.getHref(),
    labelKey: 'nav.notifications',
    hintKey: 'operations.items.notifications',
  },
  {
    to: paths.admin.aiConfiguration.getHref(),
    labelKey: 'nav.aiConfiguration',
    hintKey: 'operations.items.aiConfiguration',
  },
];

export default function AdminOperationsRoute() {
  const { t } = useTranslation();

  return (
    <ContentLayout
      title={t('nav.operations')}
      context={t('operations.context')}
    >
      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tasks.map((task) => (
          <li key={task.to}>
            <Link
              to={task.to}
              className="block h-full rounded-(--radius-card) focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
              aria-label={t(task.labelKey)}
            >
              <Card className="h-full p-4 transition-shadow hover:shadow-xs">
                <div className="flex items-start gap-3">
                  <GraduationCap
                    className="mt-0.5 size-5 shrink-0 text-muted-foreground"
                    aria-hidden
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{t(task.labelKey)}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t(task.hintKey)}
                    </p>
                  </div>
                </div>
              </Card>
            </Link>
          </li>
        ))}
      </ul>
    </ContentLayout>
  );
}
