import * as React from 'react';

import type { UserRole } from '@/types/domain';
import { cn } from '@/utils/cn';

const sizeClasses = {
  sm: 'size-6 text-2xs',
  md: 'size-8 text-xs',
  lg: 'size-10 text-sm',
} as const;

const roleClasses: Record<UserRole, string> = {
  student: 'bg-crimson-100 text-crimson-800',
  advisor: 'bg-blue-100 text-blue-800',
  dean: 'bg-violet-100 text-violet-800',
  vp: 'bg-muted text-muted-foreground',
  admin: 'bg-muted text-muted-foreground',
};

export type AvatarSize = keyof typeof sizeClasses;

export type AvatarProps = {
  name: string;
  forRole?: UserRole;
  size?: AvatarSize;
  className?: string;
};

export const Avatar = ({
  name,
  forRole = 'student',
  size = 'md',
  className,
}: AvatarProps) => {
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full font-semibold select-none',
        sizeClasses[size],
        roleClasses[forRole],
        className,
      )}
    >
      {initials(name)}
    </span>
  );
};

const initials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || '?';
