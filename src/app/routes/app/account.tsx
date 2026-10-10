import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { ContentLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { IdentityCard } from '@/features/profile/components/identity-card';
import { useLogout, useUser } from '@/lib/auth';

export default function AccountRoute() {
  const { t } = useTranslation('plan');
  const { t: tCommon } = useTranslation();
  const user = useUser();
  const logout = useLogout();
  const navigate = useNavigate();

  return (
    <ContentLayout title={t('account.title')} context={t('account.context')}>
      <div className="space-y-6">
        {user.data && <IdentityCard user={user.data} />}

        <Card>
          <CardHeader>
            <CardTitle>{tCommon('topbar.account')}</CardTitle>
          </CardHeader>
          <CardBody>
            <Button
              variant="outline"
              onClick={() =>
                logout.mutate(undefined, {
                  onSettled: () => navigate('/login'),
                })
              }
              disabled={logout.isPending}
            >
              {logout.isPending && (
                <Spinner size="sm" className="text-current" />
              )}
              {logout.isPending
                ? tCommon('topbar.signingOut')
                : tCommon('topbar.signOut')}
            </Button>
          </CardBody>
        </Card>
      </div>
    </ContentLayout>
  );
}
