import { ListPlus } from 'lucide-react';
import { Trans, useTranslation } from 'react-i18next';

import { Link } from '@/components/ui/link';
import type { ToolEvent } from '@/features/ai-chat/stores/turn-stream-store';

export type ToolEventRowProps = {
  toolEvent: ToolEvent;
};

export const ToolEventRow = ({ toolEvent }: ToolEventRowProps) => {
  const { t } = useTranslation('chat');
  return (
    <li className="flex gap-3">
      <span
        aria-hidden
        className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10"
      >
        <ListPlus className="size-3.5 text-primary-text" />
      </span>
      <div className="min-w-0 flex-1 rounded-lg border border-border bg-card p-3 text-sm">
        {toolEvent.courseCode ? (
          <p>
            <Trans
              ns="chat"
              i18nKey="toolRow.appliedCourse"
              values={{ code: toolEvent.courseCode }}
              components={[<span className="bidi-code" key="code" />]}
            />
          </p>
        ) : (
          <p>{t('toolRow.applied')}</p>
        )}
        <Link
          to="/app/builder"
          className="mt-1 inline-block text-xs font-medium text-primary-text"
        >
          {t('toolRow.openBuilder')}
        </Link>
      </div>
    </li>
  );
};
