import { useTranslation } from 'react-i18next';

import type { AcademicsImportDataset } from '@/types/domain';

import { CurrentTermForm } from './current-term-form';
import { DatasetImportCard } from './dataset-import-card';
import { SisRevokeCard } from './sis-revoke-card';

const DATASETS: AcademicsImportDataset[] = [
  'statistics',
  'active-courses',
  'credit-allowances',
  'curricula',
];

export const AcademicsDocument = () => {
  const { t } = useTranslation('admin');

  return (
    <div className="space-y-6">
      <CurrentTermForm />

      <section aria-label={t('academics.imports.title')}>
        <h2 className="text-base font-semibold">
          {t('academics.imports.title')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('academics.imports.context')}
        </p>
        <div className="mt-3 grid gap-4 lg:grid-cols-2">
          {DATASETS.map((dataset) => (
            <DatasetImportCard key={dataset} dataset={dataset} />
          ))}
        </div>
      </section>

      <section aria-label={t('academics.sisRevoke.title')}>
        <SisRevokeCard />
      </section>
    </div>
  );
};
