import { Navigate } from 'react-router';

import { paths } from '@/config/paths';

export default function AdminIndexRoute() {
  return <Navigate to={paths.admin.students.getHref()} replace />;
}
