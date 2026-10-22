import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { useNotifications } from '@/components/ui/notifications';
import { api } from '@/lib/api-client';
import { unwrap } from '@/lib/api-envelope';
import { readableApiError } from '@/lib/api-error';
import { authenticatedUserKey } from '@/lib/auth';
import { useLanguageStore } from '@/lib/language';
import type { LanguagePreference, User } from '@/types/domain';

export const useUpdateLanguagePreference = () => {
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const addNotification = useNotifications((state) => state.addNotification);
  return useMutation({
    mutationFn: (language_preference: LanguagePreference): Promise<User> =>
      unwrap<User>(api.patch('/me', { language_preference })),
    onSuccess: (user) => {
      queryClient.setQueryData(authenticatedUserKey, user);
      if (user.language_preference)
        useLanguageStore.getState().setLanguage(user.language_preference);
      void queryClient.invalidateQueries();
    },
    onError: (error) =>
      addNotification({
        type: 'error',
        title: readableApiError(error, t('errors.saveFailed')),
      }),
  });
};
