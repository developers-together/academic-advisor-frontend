import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { RulesDocument } from '@/features/rules/components/rules-document';

export default function StudentRulesRoute() {
  const { t } = useTranslation('rules');

  return (
    <ContentLayout title={t('title')} context={t('context')}>
      <RulesDocument />
    </ContentLayout>
  );
}
