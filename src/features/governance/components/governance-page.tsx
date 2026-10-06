import * as React from 'react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { ContentLayout } from '@/components/layouts';
import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';

import { GovernanceExportButton } from './governance-export-button';

export const GovernancePage = ({
  audience,
  title,
  context,
  children,
}: {
  audience: 'dean' | 'vp';
  title: string;
  context?: React.ReactNode;
  children: React.ReactNode;
}) => {
  const { t } = useTranslation();
  const [exportDenied, setExportDenied] = useState(false);

  return (
    <ContentLayout
      title={title}
      context={context}
      actions={
        exportDenied ? undefined : (
          <GovernanceExportButton
            audience={audience}
            onDenied={() => setExportDenied(true)}
          />
        )
      }
    >
      <div className="space-y-4">
        {exportDenied && (
          <Banner
            variant="warning"
            title={t('errors.forbidden')}
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => setExportDenied(false)}
              >
                {t('actions.close')}
              </Button>
            }
          />
        )}
        {children}
      </div>
    </ContentLayout>
  );
};
