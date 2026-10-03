import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { useNotifications } from '@/components/ui/notifications';
import { ApiError } from '@/lib/api-error';

import {
  downloadGovernanceCsv,
  exportGovernanceCsv,
} from '../api/export-governance-csv';
import { useGovernanceDashboard } from '../api/get-governance-dashboard';

export const GovernanceExportButton = ({
  audience,
  onDenied,
}: {
  audience: 'dean' | 'vp';
  onDenied: () => void;
}) => {
  const { t } = useTranslation('governance');
  const addNotification = useNotifications((state) => state.addNotification);
  const { data } = useGovernanceDashboard();
  const term = data?.term_code ?? 'unknown';

  const exportMutation = useMutation({
    mutationFn: async () => {
      const csv = await exportGovernanceCsv();
      downloadGovernanceCsv(csv, term);
    },
    onSuccess: () => {
      addNotification({
        type: 'success',
        title: t(`${audience}.exported`),
      });
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 403) {
        onDenied();
        return;
      }
      addNotification({
        type: 'error',
        title: t(`${audience}.exportFailed`),
      });
    },
  });

  return (
    <Button
      onClick={() => exportMutation.mutate()}
      isLoading={exportMutation.isPending}
      aria-busy={exportMutation.isPending}
    >
      {t(`${audience}.export`)}
    </Button>
  );
};
