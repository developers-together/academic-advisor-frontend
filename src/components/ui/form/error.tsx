import { useTranslation } from 'react-i18next';

export type ErrorProps = {
  errorMessage?: string | null;
};

const DICTIONARY_KEY = /^[a-z][a-z0-9]*(\.[a-z0-9-]+)+$/i;

export const Error = ({ errorMessage }: ErrorProps) => {
  const { t } = useTranslation();

  if (!errorMessage) return null;

  const body = DICTIONARY_KEY.test(errorMessage)
    ? t(errorMessage, { defaultValue: errorMessage })
    : errorMessage;

  return (
    <div
      role="alert"
      aria-label={body}
      className="text-sm font-medium text-destructive"
    >
      {body}
    </div>
  );
};
