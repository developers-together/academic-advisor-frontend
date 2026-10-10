import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Badge } from '@/components/ui/badge';
import { ErrorState } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import {
  TableBody,
  TableCell,
  TableElement,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ApiError } from '@/lib/api-error';
import { PermissionDenied } from '@/lib/authorization';
import { formatDate } from '@/lib/i18n/format';
import type { UniversityRule } from '@/types/domain';

import { useAdminRules } from '../api/get-admin-rules';

import { RuleEditorDialog } from './rule-editor-dialog';

export const RulesDocument = () => {
  const { t } = useTranslation('admin');
  const rulesQuery = useAdminRules();

  const [editing, setEditing] = useState<UniversityRule | null>(null);
  const [creating, setCreating] = useState(false);

  if (rulesQuery.isPending) {
    return (
      <div aria-busy="true" className="space-y-3">
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (rulesQuery.isError) {
    if (
      rulesQuery.error instanceof ApiError &&
      rulesQuery.error.status === 403
    ) {
      return <PermissionDenied audience="admin" />;
    }
    return (
      <ErrorState
        onRetry={() => void rulesQuery.refetch()}
        requestId={
          rulesQuery.error instanceof ApiError
            ? rulesQuery.error.requestId
            : null
        }
      />
    );
  }

  const rules = rulesQuery.data;

  const editor = (editing || creating) && (
    <RuleEditorDialog
      rule={editing}
      onClose={() => {
        setEditing(null);
        setCreating(false);
      }}
    />
  );

  if (rules.length === 0) {
    return (
      <>
        <EmptyState
          compact
          title={t('rules.empty.title')}
          description={t('rules.empty.body')}
          action={{
            label: t('rules.new'),
            onClick: () => setCreating(true),
          }}
          className="max-w-xl"
        />
        {editor}
      </>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button onClick={() => setCreating(true)}>{t('rules.new')}</Button>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <TableElement>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {(['titleEn', 'titleAr', 'scope', 'updated'] as const).map(
                (key) => (
                  <TableHead
                    key={key}
                    className="sticky top-0 z-10 bg-card px-3 py-2 text-2xs font-medium tracking-wide uppercase"
                  >
                    {t(`rules.columns.${key}`)}
                  </TableHead>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.map((rule) => (
              <TableRow key={rule.id} className="border-border">
                <TableCell className="px-3 py-2">
                  <button
                    type="button"
                    aria-label={t('rules.actions.edit', {
                      title: rule.title_en,
                    })}
                    onClick={() => setEditing(rule)}
                    className="rounded-sm text-start text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-hidden"
                  >
                    {rule.title_en}
                  </button>
                </TableCell>
                <TableCell className="px-3 py-2 text-sm" dir="rtl">
                  {rule.title_ar}
                </TableCell>
                <TableCell className="px-3 py-2 text-sm">
                  {rule.faculty ?? (
                    <Badge size="sm">{t('rules.scope.global')}</Badge>
                  )}
                </TableCell>
                <TableCell className="px-3 py-2 text-2xs text-muted-foreground tabular-nums">
                  {formatDate(rule.updated_at)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </TableElement>
      </div>

      {editor}
    </div>
  );
};
