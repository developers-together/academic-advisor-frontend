import { CircleAlert } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Banner } from '@/components/ui/banner';
import { Link } from '@/components/ui/link';
import type { SubmitResultInfo } from '@/features/ai-chat/stores/turn-stream-store';

export type SubmitResultRowProps = {
  result: SubmitResultInfo;
};

export const SubmitResultRow = ({ result }: SubmitResultRowProps) => {
  const { t } = useTranslation('chat');
  if (result.status === 'submitted') {
    return (
      <li>
        <Banner
          variant="success"
          title={t('submitCard.resultSubmitted')}
          action={
            <Link to="/app/plan" className="text-sm font-medium text-primary">
              {t('submitCard.resultOpenPlan')}
            </Link>
          }
        />
      </li>
    );
  }
  return (
    <li>
      <Banner variant="destructive" title={t('submitCard.resultBlocked')}>
        <ul className="space-y-1">
          {Object.values(result.errors)
            .flat()
            .map((message) => (
              <li
                key={message}
                className="flex items-start gap-2 text-sm text-destructive"
              >
                <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />
                <span>{message}</span>
              </li>
            ))}
        </ul>
      </Banner>
    </li>
  );
};
