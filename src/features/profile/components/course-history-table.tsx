import { History, Search } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import type { CourseAttempt } from '@/types/domain';

export type CourseHistoryTableProps = {
  history: CourseAttempt[];
};

const termOf = (attempt: CourseAttempt) =>
  attempt.term_code?.trim() ||
  [attempt.year, attempt.semester].filter(Boolean).join(' · ') ||
  '__unreported__';

export const CourseHistoryTable = ({ history }: CourseHistoryTableProps) => {
  const { t } = useTranslation('plan');
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const terms = [...new Set(history.map(termOf))].sort().reverse();
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const visible = history.filter(
    (attempt) =>
      (!term || termOf(attempt) === term) &&
      [attempt.course_code, attempt.name, attempt.title].some((value) =>
        value?.toLocaleLowerCase().includes(normalizedSearch),
      ),
  );
  const visibleTerms = terms.filter((entry) =>
    visible.some((attempt) => termOf(attempt) === entry),
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="size-5 text-primary-text" aria-hidden />
          {t('profile.history.title')}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {t('recordDetails.historyContext')}
        </p>
      </CardHeader>
      <CardBody>
        {history.length === 0 ? (
          <EmptyState compact title={t('profile.history.empty')} />
        ) : (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="flex min-h-11 items-center gap-2 rounded-xl border border-input px-3 focus-within:ring-2 focus-within:ring-ring">
                <Search
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-hidden
                />
                <span className="sr-only">{t('recordDetails.search')}</span>
                <input
                  className="min-w-0 flex-1 bg-transparent py-3 text-sm outline-none"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder={t('recordDetails.search')}
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <span>{t('profile.history.term')}</span>
                <select
                  className="min-h-11 rounded-xl border border-input bg-background px-3 focus-visible:ring-2 focus-visible:ring-ring"
                  value={term}
                  onChange={(event) => setTerm(event.target.value)}
                >
                  <option value="">{t('recordDetails.allTerms')}</option>
                  {terms.map((entry) => (
                    <option key={entry} value={entry}>
                      {entry === '__unreported__'
                        ? t('profile.unavailable')
                        : entry}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <p className="text-sm text-muted-foreground" role="status">
              {t('recordDetails.attempts', { count: visible.length })}
            </p>
            {visible.length === 0 && (
              <EmptyState compact title={t('recordDetails.noResults')} />
            )}
            {visibleTerms.map((entry) => (
              <section
                key={entry}
                className="border-s-2 border-primary/20 ps-4 sm:ps-6"
                aria-label={
                  entry === '__unreported__' ? t('profile.unavailable') : entry
                }
              >
                <h3 className="mb-4 text-base font-semibold">
                  {entry === '__unreported__'
                    ? t('profile.unavailable')
                    : entry}
                </h3>
                <ul className="divide-y divide-border">
                  {visible
                    .filter((attempt) => termOf(attempt) === entry)
                    .map((attempt, index) => (
                      <li
                        key={`${attempt.course_code}-${index}`}
                        className="grid gap-3 py-4 sm:grid-cols-[1fr_auto]"
                      >
                        <div>
                          <p className="bidi-code text-xs font-medium text-primary-text">
                            {attempt.course_code}
                          </p>
                          <p className="mt-1 font-medium">
                            {attempt.name ??
                              attempt.title ??
                              attempt.course_code}
                          </p>
                          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
                            <div>
                              <dt className="inline">
                                {t('profile.history.credits')}:{' '}
                              </dt>
                              <dd className="inline tabular-nums">
                                {attempt.credits ??
                                  t('recordDetails.unreported')}
                              </dd>
                            </div>
                            <div>
                              <dt className="inline">
                                {t('profile.history.level')}:{' '}
                              </dt>
                              <dd className="inline tabular-nums">
                                {attempt.level ?? t('recordDetails.unreported')}
                              </dd>
                            </div>
                          </dl>
                        </div>
                        <dl className="flex items-center gap-2 text-sm sm:flex-col sm:items-end">
                          <dt className="text-muted-foreground">
                            {t('profile.history.grade')}
                          </dt>
                          <dd className="rounded-lg border border-border bg-muted px-3 py-1 font-semibold tabular-nums">
                            {attempt.grade}
                          </dd>
                        </dl>
                      </li>
                    ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </CardBody>
    </Card>
  );
};
