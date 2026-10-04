import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { QueueAgingCard } from '@/features/admin/components/queue-aging-card';
import { RulesDocument } from '@/features/admin/components/rules-document';

export default function AdminRulesRoute() {
  const { t } = useTranslation('admin');

  return (
    <ContentLayout title={t('rules.title')} context={t('rules.context')}>
      <div className="space-y-6">
        <RulesDocument />
        <QueueAgingCard />
      </div>
    </ContentLayout>
  );
}
