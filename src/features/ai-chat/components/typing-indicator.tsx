import { useTranslation } from 'react-i18next';

import { EjustResponseMark } from './ejust-response-mark';

export const TypingIndicator = () => {
  const { t } = useTranslation('chat');
  return (
    <li className="flex items-center gap-3" role="status">
      <EjustResponseMark phase="thinking" />
      <span className="text-sm text-muted-foreground">
        {t('transcript.typing')}
      </span>
    </li>
  );
};
