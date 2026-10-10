import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Navigate, createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { RouteErrorBoundary } from '@/components/layouts/route-error-boundary';
import { Spinner } from '@/components/ui/spinner';
import { paths } from '@/config/paths';
import { routeTable } from '@/config/routes';
import type { UserRole } from '@/types/domain';

const convert = (queryClient: QueryClient) => (m: any) => {
  const { clientLoader, clientAction, default: Component, ...rest } = m;
  return {
    ...rest,
    loader: clientLoader?.(queryClient),
    action: clientAction?.(queryClient),
    Component,
  };
};

const loaders: Record<string, () => Promise<{ default: unknown }>> = {
  root: () => import('./routes/role-redirect'),
  'not-found': () => import('./routes/not-found'),
  'auth.login': () => import('./routes/auth/login'),
  'auth.signup': () => import('./routes/auth/signup'),
  'auth.forgot-password': () => import('./routes/auth/forgot-password'),
  'auth.verify-email': () => import('./routes/auth/verify-email'),
  'app.home': () => import('./routes/app/dashboard'),
  'app.plan': () => import('./routes/app/plan'),
  'app.builder': () => import('./routes/app/builder'),
  'app.record': () => import('./routes/app/record'),
  'app.rules': () => import('./routes/app/rules'),
  'app.chat': () => import('./routes/app/chat'),
  'app.conversation': () => import('./routes/app/conversation'),
  'app.advisor': () => import('./routes/app/my-advisor'),
  'app.notifications': () => import('./routes/app/notifications'),
  'app.account': () => import('./routes/app/account'),
  'advisor.queue': () => import('./routes/advisor/index'),
  'advisor.students': () => import('./routes/advisor/students'),
  'advisor.meetings': () => import('./routes/advisor/meetings'),
  'advisor.hours': () => import('./routes/advisor/hours'),
  'advisor.profile': () => import('./routes/advisor/profile'),
  'advisor.notifications': () => import('./routes/advisor/notifications'),
  'dean.overview': () => import('./routes/dean/index'),
  'dean.advisors': () => import('./routes/dean/advisors'),
  'dean.analytics': () => import('./routes/dean/analytics'),
  'dean.notifications': () => import('./routes/dean/notifications'),
  'vp.overview': () => import('./routes/vp/index'),
  'vp.faculties': () => import('./routes/vp/faculties'),
  'vp.drilldown': () => import('./routes/vp/drilldown'),
  'vp.trends': () => import('./routes/vp/trends'),
  'vp.notifications': () => import('./routes/vp/notifications'),
  'admin.overview': () => import('./routes/admin/index'),
  'admin.users': () => import('./routes/admin/users'),
  'admin.operations': () => import('./routes/admin/operations'),
  'admin.assignments': () => import('./routes/admin/assignments'),
  'admin.courses': () => import('./routes/admin/courses'),
  'admin.programs': () => import('./routes/admin/programs'),
  'admin.rules': () => import('./routes/admin/rules'),
  'admin.registration-windows': () =>
    import('./routes/admin/registration-windows'),
  'admin.academics': () => import('./routes/admin/academics'),
  'admin.ai-configuration': () => import('./routes/admin/ai-configuration'),
  'admin.notifications': () => import('./routes/admin/notifications'),
};

const roleShells: Record<UserRole, string> = {
  student: paths.app.root.getHref(),
  advisor: paths.advisor.root.getHref(),
  dean: paths.dean.root.getHref(),
  vp: paths.vp.root.getHref(),
  admin: paths.admin.root.getHref(),
};

const shellLoaders: Record<UserRole, () => Promise<{ default: unknown }>> = {
  student: () => import('./routes/app/shell'),
  advisor: () => import('./routes/advisor/shell'),
  dean: () => import('./routes/dean/shell'),
  vp: () => import('./routes/vp/shell'),
  admin: () => import('./routes/admin/shell'),
};

export const createAppRouter = (queryClient: QueryClient) => {
  const load = (id: string) => () =>
    loaders[id]!()
      .then(convert(queryClient))
      .catch(() => ({ Component: RouteErrorBoundary }));

  const topLevel = routeTable
    .filter((route) => route.role === 'public' || route.role === 'auth')
    .filter((route) => route.path !== '*')
    .map((route) => ({ path: route.path, lazy: load(route.id) }));

  const sections = (Object.keys(roleShells) as UserRole[]).map((role) => {
    const rootPath = roleShells[role];
    const relative = (path: string) =>
      path === rootPath ? undefined : path.slice(rootPath.length + 1);
    const children = routeTable
      .filter((route) => route.role === role)
      .map((route) => {
        if (route.kind === 'redirect') {
          return {
            path: relative(route.path),
            element: <Navigate to={route.redirectTo!} replace />,
          };
        }
        return {
          errorElement: <RouteErrorBoundary />,
          index: route.index === true,
          path: relative(route.path),
          lazy: load(route.id),
        };
      });
    return {
      path: rootPath,
      lazy: () => shellLoaders[role]().then(convert(queryClient)),
      children,
    };
  });

  const hydrateFallbackElement = (
    <div
      role="status"
      className="flex min-h-dvh items-center justify-center bg-background"
    >
      <Spinner size="lg" />
    </div>
  );

  return createBrowserRouter([
    ...topLevel.map((route) => ({
      ...route,
      hydrateFallbackElement,
      errorElement: <RouteErrorBoundary />,
    })),
    ...sections.map((section) => ({
      ...section,
      hydrateFallbackElement,
      errorElement: <RouteErrorBoundary />,
    })),
    {
      path: '*',
      hydrateFallbackElement,
      errorElement: <RouteErrorBoundary />,
      lazy: () => import('./routes/not-found').then(convert(queryClient)),
    },
  ]);
};

export const AppRouter = () => {
  const queryClient = useQueryClient();

  const router = useMemo(() => createAppRouter(queryClient), [queryClient]);

  return <RouterProvider router={router} />;
};
