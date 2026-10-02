import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { EmptyState } from '@/components/ui/empty-state';

export default function AdminRulesRoute() {
  const { t } = useTranslation('admin');

  return (
    <ContentLayout title={t('rules.title')} context={t('rules.context')}>
      <EmptyState
        compact
        title={t('rules.empty.title')}
        description={t('rules.empty.body')}
        className="max-w-xl"
      />
    </ContentLayout>
  );
}
