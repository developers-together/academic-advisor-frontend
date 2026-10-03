import * as React from 'react';
import { useState } from 'react';

import { ContentLayout } from '@/components/layouts';
import { PermissionDenied } from '@/lib/authorization';

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
      {exportDenied ? <PermissionDenied audience={audience} /> : children}
    </ContentLayout>
  );
};
