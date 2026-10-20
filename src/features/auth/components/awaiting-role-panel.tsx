import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router';

import { Button } from '@/components/ui/button';
import { paths } from '@/config/paths';
import { useLogout, useUser } from '@/lib/auth';

export const AwaitingRolePanel = () => {
  const { t } = useTranslation('auth');
  const user = useUser();
  const logout = useLogout();

  if (!user.data) {
    return <Navigate to={paths.auth.login.getHref()} replace />;
  }

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
      <Button
        variant="outline"
        className="h-11"
        onClick={() => logout.mutate(undefined)}
        isLoading={logout.isPending}
        disabled={logout.isPending}
        aria-busy={logout.isPending}
      >
        {t('microsoft.awaitingRole.signOut')}
      </Button>
    </div>
  );
};
