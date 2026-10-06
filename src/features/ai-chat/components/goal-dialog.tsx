import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCreateConversation } from '@/features/ai-chat/api/conversations';
import type { PlanConversation, PlanGoal } from '@/types/domain';
import { cn } from '@/utils/cn';

const GOALS: PlanGoal[] = ['maintain', 'improve', 'excel'];

export type GoalDialogProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (conversation: PlanConversation) => void;
};

export const GoalDialog = ({ open, onClose, onCreated }: GoalDialogProps) => {
  const { t } = useTranslation('chat');
  const [goal, setGoal] = useState<PlanGoal | null>(null);
  const createConversation = useCreateConversation();

  const start = () => {
    if (!goal) {
      return;
    }
    createConversation.mutate(
      { goal },
      {
        onSuccess: (conversation) => {
          setGoal(null);
          onCreated(conversation);
        },
      },
    );
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) {
          setGoal(null);
          createConversation.reset();
          onClose();
        }
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('goalDialog.title')}</DialogTitle>
          <DialogDescription>{t('goalDialog.body')}</DialogDescription>
        </DialogHeader>
        {createConversation.isError && (
          <Banner variant="destructive" title={t('common:errors.saveFailed')}>
            <p>{t('common:errors.saveFailedBody')}</p>
          </Banner>
        )}
        <div className="grid gap-2 sm:grid-cols-3">
          {GOALS.map((candidate) => (
            <button
              key={candidate}
              type="button"
              aria-pressed={goal === candidate}
              onClick={() => setGoal(candidate)}
              className={cn(
                'rounded-lg border p-4 text-start text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-hidden',
                goal === candidate
                  ? 'border-crimson-300 bg-crimson-100'
                  : 'border-border bg-card hover:bg-accent',
              )}
            >
              {t(`goals.${candidate}`)}
            </button>
          ))}
        </div>
        <DialogFooter>
          <Button
            onClick={start}
            disabled={!goal}
            isLoading={createConversation.isPending}
          >
            {t('goalDialog.start')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
