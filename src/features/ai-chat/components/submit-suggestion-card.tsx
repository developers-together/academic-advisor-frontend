import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { Banner, ErrorState } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { ConfirmDialog } from '@/components/ui/dialog';
import { Link } from '@/components/ui/link';
import { planConversationsRootKey } from '@/features/ai-chat/api/conversations';
import { useArmSubmission } from '@/features/ai-chat/api/use-arm-submission';
import { ApiError } from '@/lib/api-error';

export type SubmitSuggestionCardProps = {
  conversationId: number;
};

export const SubmitSuggestionCard = ({
  conversationId,
}: SubmitSuggestionCardProps) => {
  const { t } = useTranslation('chat');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const armSubmission = useArmSubmission(conversationId);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const arm = () => {
    armSubmission.mutate(undefined, {
      onSuccess: () => setConfirmOpen(false),
      onError: (error) => {
        setConfirmOpen(false);
        if (error instanceof ApiError && error.status === 404) {
          void queryClient.invalidateQueries({
            queryKey: planConversationsRootKey,
          });
          void navigate('/app/chat');
        }
      },
    });
  };

  const armError = armSubmission.error;
  if (
    armSubmission.isError &&
    !(armError instanceof ApiError && armError.status === 404)
  ) {
    return <ErrorState compact onRetry={() => armSubmission.mutate()} />;
  }

  return (
    <Banner variant="info" title={t('submitCard.title')}>
      <p>{t('submitCard.body')}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" className="h-11" onClick={() => setConfirmOpen(true)}>
          {t('submitCard.confirm')}
        </Button>
        <Link to="/app/builder" className="text-sm underline">
          {t('submitCard.review')}
        </Link>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={arm}
        title={t('submitCard.confirmDialog.title')}
        body={t('submitCard.confirmDialog.body')}
        confirmLabel={t('submitCard.confirmDialog.confirm')}
        pending={armSubmission.isPending}
      />
    </Banner>
  );
};

export type ArmedCardProps = {
  onSuggestion: () => void;
};

export const ArmedCard = ({ onSuggestion }: ArmedCardProps) => {
  const { t } = useTranslation('chat');
  return (
    <Banner
      variant="info"
      title={t('submitCard.armed')}
      action={
        <Button
          variant="outline"
          size="sm"
          className="h-11"
          onClick={onSuggestion}
        >
          {t('submitCard.armedSuggestion')}
        </Button>
      }
    />
  );
};
