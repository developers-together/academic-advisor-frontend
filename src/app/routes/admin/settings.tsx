import { Navigate } from 'react-router';

import { paths } from '@/config/paths';

export default function AdminSettingsRoute() {
  return <Navigate to={paths.admin.users.getHref()} replace />;
}
