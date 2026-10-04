import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { AiConfigurationDocument } from '@/features/admin/components/ai-configuration-document';

export default function AdminAiConfigurationRoute() {
  const { t } = useTranslation('admin');

  return (
    <ContentLayout title={t('ai.title')} context={t('ai.context')}>
      <AiConfigurationDocument />
    </ContentLayout>
  );
}
