import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import type { User } from '@/types/domain';
import {
  authenticatedUserKey,
  getAuthenticatedUser,
  roleLanding,
  useLogout,
  useUser,
} from '@/lib/auth';
import { tokenStorage } from '@/lib/token-storage';

export const AwaitingRolePanel = () => {
  const { t } = useTranslation('auth');
  const user = useUser();
  const logout = useLogout();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const checkAccess = useMutation({
    mutationFn: async (): Promise<User | null> => getAuthenticatedUser(),
    onSuccess: (refreshed) => {
      if (!tokenStorage.get()) {
        return;
      }
      queryClient.setQueryData(authenticatedUserKey, refreshed);
      if (refreshed?.role) {
        navigate(roleLanding[refreshed.role], { replace: true });
      }
    },
  });

  if (!user.data) {
    return <Navigate to={paths.auth.login.getHref()} replace />;
  }

  const stillWaiting = checkAccess.isSuccess && !checkAccess.data?.role;

  return (
    <div className="space-y-4 text-sm">
      <p className="text-muted-foreground">
        {t('microsoft.awaitingRole.body')}
      </p>
      <dl>
        <dt className="text-xs text-muted-foreground">
          {t('microsoft.awaitingRole.emailLabel')}
        </dt>
        <dd className="mt-1 text-sm font-medium wrap-break-word">
          {user.data.email}
        </dd>
      </dl>
      {checkAccess.isError && (
        <p role="alert" className="font-medium text-destructive">
          {t('microsoft.awaitingRole.checkFailed')}
        </p>
      )}
      {stillWaiting && (
        <p role="status" className="text-muted-foreground">
          {t('microsoft.awaitingRole.stillWaiting')}
        </p>
      )}
      <div className="flex flex-col gap-2">
        <Button
          className="h-11 w-full"
          onClick={() => checkAccess.mutate(undefined)}
          isLoading={checkAccess.isPending}
          disabled={checkAccess.isPending}
          aria-busy={checkAccess.isPending}
        >
          {t('microsoft.awaitingRole.checkAccess')}
        </Button>
        <Button
          variant="outline"
          className="h-11 w-full"
          onClick={() => logout.mutate(undefined)}
          isLoading={logout.isPending}
          disabled={logout.isPending}
          aria-busy={logout.isPending}
        >
          {t('microsoft.awaitingRole.signOut')}
        </Button>
      </div>
    </div>
  );
};
