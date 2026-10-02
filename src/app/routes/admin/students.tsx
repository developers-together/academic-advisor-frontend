import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { EmptyState } from '@/components/ui/empty-state';

export default function AdminAccountsRoute() {
  const { t } = useTranslation('admin');

  return (
    <ContentLayout title={t('accounts.title')} context={t('accounts.context')}>
      <EmptyState
        compact
        title={t('accounts.empty.noRows')}
        description={t('accounts.empty.noRowsBody')}
        className="max-w-xl"
      />
    </ContentLayout>
  );
}
