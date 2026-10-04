import { Navigate } from 'react-router';

import { paths } from '@/config/paths';

export default function ProfileRoute() {
  return <Navigate to={paths.app.account.getHref()} replace />;
}
