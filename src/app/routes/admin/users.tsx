import { Navigate } from 'react-router';

import { paths } from '@/config/paths';

export default function AdminUsersRoute() {
  return <Navigate to={paths.admin.students.getHref()} replace />;
}
