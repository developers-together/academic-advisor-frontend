import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { RulesDocument } from '@/features/admin/components/rules-document';

export default function AdminRulesRoute() {
  const { t } = useTranslation('admin');

  return (
    <ContentLayout title={t('rules.title')} context={t('rules.context')}>
      <RulesDocument />
    </ContentLayout>
  );
}
