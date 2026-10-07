import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/button';
import { Card, CardBody, CardHeader, CardTitle } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/dialog';
import { useNotifications } from '@/components/ui/notifications';
import {
  TableBody,
  TableCell,
  TableElement,
  TableRow,
} from '@/components/ui/table';
import { ApiError } from '@/lib/api-error';
import type {
  AcademicsImportDataset,
  AcademicsImportReport,
} from '@/types/domain';

import { useImportAcademicsDataset } from '../api/academics';

const MAX_FILE_BYTES = 2048 * 1024;
const ACCEPTED_EXTENSIONS = ['.csv', '.xlsx'];
const MAX_REPORT_ROWS = 20;

export type DatasetImportCardProps = {
  dataset: AcademicsImportDataset;
};

export const DatasetImportCard = ({ dataset }: DatasetImportCardProps) => {
  const { t } = useTranslation('admin');
  const addNotification = useNotifications((state) => state.addNotification);
  const importMutation = useImportAcademicsDataset();
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [report, setReport] = useState<AcademicsImportReport | null>(null);

  const titleKey = `academics.imports.${dataset}`;
  const hintKey = `academics.imports.${dataset}Hint`;

  const onFileChange = (next: File | null) => {
    setFileError(null);
    setReport(null);
    setFile(next);
    if (!next) {
      return;
    }
    const extension = next.name.slice(next.name.lastIndexOf('.')).toLowerCase();
    if (!ACCEPTED_EXTENSIONS.includes(extension)) {
      setFileError(t('academics.imports.errors.fileType'));
      return;
    }
    if (next.size > MAX_FILE_BYTES) {
      setFileError(t('academics.imports.errors.fileSize'));
    }
  };

  const runImport = () => {
    if (!file) {
      setFileError(t('academics.imports.errors.fileRequired'));
      return;
    }
    importMutation.mutate(
      { dataset, file },
      {
        onSuccess: (result) => {
          setConfirmOpen(false);
          setReport(result);
          addNotification({
            type: 'success',
            title: t('academics.imports.success', {
              dataset: t(titleKey),
            }),
          });
        },
        onError: (error) => {
          setConfirmOpen(false);
          if (error instanceof ApiError && error.status === 422) {
            const fileMessage = error.fields.file?.[0];
            setFileError(fileMessage ?? t('common:errors.saveFailed'));
            return;
          }
          addNotification({
            type: 'error',
            title: t('common:errors.saveFailed'),
          });
        },
      },
    );
  };

  return (
    <Card data-testid={`import-card-${dataset}`}>
      <CardHeader>
        <CardTitle>{t(titleKey)}</CardTitle>
        <p className="mt-1 text-sm text-muted-foreground">{t(hintKey)}</p>
      </CardHeader>
      <CardBody className="space-y-3">
        {report && (
          <div className="space-y-2">
            <p className="text-sm font-medium tabular-nums">
              {t('academics.imports.summary', {
                imported: report.imported,
                skipped: report.skipped,
                errors: report.errors.length,
              })}
            </p>
            {report.errors.length > 0 && (
              <>
                <p className="text-sm font-medium">
                  {t('academics.imports.reportTitle')}
                </p>
                <div className="max-h-64 overflow-y-auto rounded-lg border">
                  <TableElement>
                    <TableBody>
                      {report.errors
                        .slice(0, MAX_REPORT_ROWS)
                        .map((message) => (
                          <TableRow key={report.errors.indexOf(message)}>
                            <TableCell className="w-24 px-3 py-2 text-2xs text-muted-foreground tabular-nums">
                              {t('academics.imports.reportRow', {
                                n: report.errors.indexOf(message) + 1,
                              })}
                            </TableCell>
                            <TableCell className="px-3 py-2 text-sm">
                              {message}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </TableElement>
                </div>
                {report.errors.length > MAX_REPORT_ROWS && (
                  <p className="text-2xs text-muted-foreground">
                    {t('academics.imports.reportMore', {
                      count: report.errors.length - MAX_REPORT_ROWS,
                    })}
                  </p>
                )}
              </>
            )}
          </div>
        )}
        <div className="space-y-2">
          <input
            ref={inputRef}
            id={`import-${dataset}-file`}
            type="file"
            accept={ACCEPTED_EXTENSIONS.join(',')}
            onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-accent"
          />
          <label
            htmlFor={`import-${dataset}-file`}
            className="text-xs font-medium"
          >
            {t('academics.imports.fileLabel')}
          </label>
          {fileError && (
            <p role="alert" className="text-sm text-destructive">
              {fileError}
            </p>
          )}
        </div>
        <Button
          disabled={!file || Boolean(fileError)}
          isLoading={importMutation.isPending}
          aria-busy={importMutation.isPending}
          onClick={() => setConfirmOpen(true)}
        >
          {t('academics.imports.upload')}
        </Button>
      </CardBody>

      <ConfirmDialog
        open={confirmOpen}
        title={t('academics.imports.confirmTitle')}
        body={t('academics.imports.confirmBody')}
        confirmLabel={t('academics.imports.upload')}
        pending={importMutation.isPending}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={runImport}
      />
    </Card>
  );
};
