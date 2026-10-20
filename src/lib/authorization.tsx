import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, Navigate, useLocation } from 'react-router';

import { paths } from '@/config/paths';
import type { UserRole } from '@/types/domain';
import { cn } from '@/utils/cn';

import { useUser } from './auth';

export type AccountStatus =
  | { kind: 'signed-out' }
  | { kind: 'awaiting-role'; email: string }
  | { kind: 'signed-in'; role: UserRole; email: string };

export const useAccountStatus = (): AccountStatus => {
  const user = useUser();
  const account = user.data;

  if (!account) {
    return { kind: 'signed-out' };
  }

  if (account.role === null) {
    return { kind: 'awaiting-role', email: account.email };
  }

  return { kind: 'signed-in', role: account.role, email: account.email };
};

export const roleHome = (role: UserRole): string => {
  switch (role) {
    case 'student':
      return paths.app.root.getHref();
    case 'advisor':
      return paths.advisor.root.getHref();
    case 'dean':
      return paths.dean.root.getHref();
    case 'vp':
      return paths.vp.root.getHref();
    case 'admin':
      return paths.admin.root.getHref();
  }
};

export type PermissionDeniedProps = {
  audience?: UserRole;
  message?: string;
  backTo?: { label: string; href: string };
  className?: string;
};

export const PermissionDenied = ({
  audience,
  message,
  backTo,
  className,
}: PermissionDeniedProps) => {
  const { t } = useTranslation();

  return (
    <div
      className={cn(
        'mx-auto my-16 max-w-md rounded-lg border bg-card p-6 text-center',
        className,
      )}
    >
      <p className="text-sm text-muted-foreground">
        {message ??
          (audience
            ? t('permissionDenied.title', { audience: t(`roles.${audience}`) })
            : t('errors.forbidden'))}
      </p>
      {backTo && (
        <Link
          to={backTo.href}
          className="mt-4 inline-flex h-11 items-center rounded-md px-4 text-sm font-medium text-primary-text underline-offset-4 hover:underline"
        >
          {t(backTo.label)}
        </Link>
      )}
    </div>
  );
};

/**
 * Wraps a role section. Renders PermissionDenied on direct URL hits by
 * another role (design.md DS-L-01).
 */
export const RoleRoute = ({
  allow,
  children,
}: {
  allow: UserRole;
  children: React.ReactNode;
}) => {
  const account = useAccountStatus();

  if (account.kind !== 'signed-in') {
    return null;
  }

  if (account.role !== allow) {
    return (
      <PermissionDenied
        audience={allow}
        backTo={{
          label: 'permissionDenied.back',
          href: roleHome(account.role),
        }}
      />
    );
  }

  return <>{children}</>;
};

/**
 * The / entry point: unauthenticated visitors go to login, everyone else
 * to their role landing (App skeleton, Decision 4).
 */
export const RoleRedirect = () => {
  const account = useAccountStatus();
  const location = useLocation();

  if (account.kind === 'signed-out') {
    return (
      <Navigate
        to={paths.auth.login.getHref(`${location.pathname}${location.search}`)}
        replace
      />
    );
  }

  if (account.kind === 'awaiting-role') {
    return <Navigate to={paths.auth.awaitingRole.getHref()} replace />;
  }

  return <Navigate to={roleHome(account.role)} replace />;
};
