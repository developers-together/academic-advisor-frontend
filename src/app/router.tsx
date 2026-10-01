import { QueryClient, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { createBrowserRouter } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { paths } from '@/config/paths';

const convert = (queryClient: QueryClient) => (m: any) => {
  const { clientLoader, clientAction, default: Component, ...rest } = m;
  return {
    ...rest,
    loader: clientLoader?.(queryClient),
    action: clientAction?.(queryClient),
    Component,
  };
};

export const createAppRouter = (queryClient: QueryClient) =>
  createBrowserRouter([
    {
      path: paths.home.path,
      lazy: () => import('./routes/role-redirect').then(convert(queryClient)),
    },

    {
      path: paths.auth.login.path,
      lazy: () => import('./routes/auth/login').then(convert(queryClient)),
    },
    {
      path: paths.auth.signup.path,
      lazy: () => import('./routes/auth/signup').then(convert(queryClient)),
    },
    {
      path: paths.auth.forgotPassword.path,
      lazy: () =>
        import('./routes/auth/forgot-password').then(convert(queryClient)),
    },
    {
      path: paths.auth.verifyEmail.path,
      lazy: () =>
        import('./routes/auth/verify-email').then(convert(queryClient)),
    },

    {
      path: paths.app.root.path,
      lazy: () => import('./routes/app/shell').then(convert(queryClient)),
      children: [
        {
          index: true,
          lazy: () =>
            import('./routes/app/dashboard').then(convert(queryClient)),
        },
        {
          path: paths.app.plan.path,
          lazy: () => import('./routes/app/plan').then(convert(queryClient)),
        },
        {
          path: paths.app.builder.path,
          lazy: () => import('./routes/app/builder').then(convert(queryClient)),
        },
      ],
    },

    {
      path: '*',
      lazy: () => import('./routes/not-found').then(convert(queryClient)),
    },
  ]);

export const AppRouter = () => {
  const queryClient = useQueryClient();

  const router = useMemo(() => createAppRouter(queryClient), [queryClient]);

  return <RouterProvider router={router} />;
};
