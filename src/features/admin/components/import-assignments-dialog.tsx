import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import {
  ConfirmDialog,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useNotifications } from '@/components/ui/notifications';
import {
  TableBody,
  TableCell,
  TableElement,
  TableRow,
} from '@/components/ui/table';
import { ApiError } from '@/lib/api-error';
import type { ImportSummary } from '@/types/domain';

import { useImportAssignments } from '../api/import-assignments';

const MAX_FILE_BYTES = 2048 * 1024;
const ACCEPTED_EXTENSIONS = ['.csv', '.txt'];
const MAX_REPORT_ROWS = 20;

type ImportRowError = { row: number; message: string };

export const ImportAssignmentsDialog = ({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) => {
  const { t } = useTranslation('admin');
  const addNotification = useNotifications((state) => state.addNotification);
  const importMutation = useImportAssignments();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [report, setReport] = useState<{
    file?: string;
    rows: ImportRowError[];
  } | null>(null);

  const reset = () => {
    setFile(null);
    setFileError(null);
    setSummary(null);
    setReport(null);
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  const close = () => {
    reset();
    onClose();
  };

  const onFileChange = (next: File | null) => {
    setFileError(null);
    setSummary(null);
    setReport(null);
    setFile(next);
    if (!next) {
      return;
    }
    const extension = next.name.slice(next.name.lastIndexOf('.')).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setFileError(t('assignments.importDialog.errors.fileType'));
      return;
    }
    if (next.size > MAX_FILE_BYTES) {
      setFileError(t('assignments.importDialog.errors.fileSize'));
    }
  };

  const runImport = () => {
    if (!file) {
      setFileError(t('assignments.importDialog.errors.fileRequired'));
      return;
    }
    setReport(null);
    importMutation.mutate(file, {
      onSuccess: (result) => {
        setConfirmOpen(false);
        setSummary(result);
        addNotification({
          type: 'success',
          title: t('assignments.importSummary.title'),
        });
      },
      onError: (error) => {
        setConfirmOpen(false);
        if (error instanceof ApiError && error.status === 422) {
          const rows: ImportRowError[] = Object.entries(error.fields)
            .filter(([key]) => key.startsWith('rows.'))
            .map(([key, messages]) => ({
              row: Number(key.slice('rows.'.length)),
              message: messages[0] ?? '',
            }))
            .sort((a, b) => a.row - b.row);
          setReport({ file: error.fields['file']?.[0], rows });
        }
      },
    });
  };

  const summaryLine =
    summary === null
      ? null
      : [
          t('assignments.importSummary.title'),
          summary.assigned === 1
            ? t('assignments.importSummary.assigned', {
                count: summary.assigned,
              })
            : t('assignments.importSummary.assignedOther', {
                count: summary.assigned,
              }),
          summary.unchanged === 1
            ? t('assignments.importSummary.unchanged', {
                count: summary.unchanged,
              })
            : t('assignments.importSummary.unchangedOther', {
                count: summary.unchanged,
              }),
          summary.scheduled === 1
            ? t('assignments.importSummary.scheduled', {
                count: summary.scheduled,
              })
            : t('assignments.importSummary.scheduledOther', {
                count: summary.scheduled,
              }),
        ].join(' ');

  return (
    <Dialog open={open} onOpenChange={(next) => !next && close()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('assignments.importDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('assignments.importDialog.helper')}
          </DialogDescription>
        </DialogHeader>

        {report?.file && <Banner variant="destructive">{report.file}</Banner>}
        {report && report.rows.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              {t('assignments.importReport.title')}
            </p>
            <div className="max-h-64 overflow-y-auto rounded-lg border">
              <TableElement>
                <TableBody>
                  {report.rows.slice(0, MAX_REPORT_ROWS).map((row) => (
                    <TableRow key={row.row}>
                      <TableCell className="w-24 px-3 py-2 text-2xs text-muted-foreground tabular-nums">
                        {t('assignments.importReport.row', { n: row.row })}
                      </TableCell>
                      <TableCell className="px-3 py-2 text-sm">
                        {row.message}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </TableElement>
            </div>
            {report.rows.length > MAX_REPORT_ROWS && (
              <p className="text-2xs text-muted-foreground">
                {t('assignments.importReport.moreRows', {
                  count: report.rows.length - MAX_REPORT_ROWS,
                })}
              </p>
            )}
          </div>
        )}

        {summaryLine ? (
          <p className="text-sm font-medium">{summaryLine}</p>
        ) : (
          <div className="space-y-2">
            <input
              ref={inputRef}
              id="import-assignments-file"
              type="file"
              accept={ACCEPTED_EXTENSIONS.join(',')}
              onChange={(event) =>
                onFileChange(event.target.files?.[0] ?? null)
              }
              className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-accent"
            />
            <label
              htmlFor="import-assignments-file"
              className="text-xs font-medium"
            >
              {t('assignments.importDialog.fileLabel')}
            </label>
            {fileError && (
              <p role="alert" className="text-sm text-destructive">
                {fileError}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={close}>
            {t('common:actions.close')}
          </Button>
          {!summaryLine && (
            <Button
              onClick={() => setConfirmOpen(true)}
              disabled={!file || Boolean(fileError)}
            >
              {t('assignments.importDialog.confirm')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>

      <ConfirmDialog
        open={confirmOpen}
        title={t('assignments.importDialog.confirmTitle')}
        body={t('assignments.importDialog.confirmBody')}
        confirmLabel={t('assignments.importDialog.confirm')}
        pending={importMutation.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={runImport}
      />
    </Dialog>
  );
};
