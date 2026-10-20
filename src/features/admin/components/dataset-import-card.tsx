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

const MAX_FILE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = ['.csv', '.txt', '.xlsx'];
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
  const [serverValidationMessages, setServerValidationMessages] = useState<
    string[]
  >([]);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [report, setReport] = useState<AcademicsImportReport | null>(null);

  const titleKey = `academics.imports.${dataset}`;
  const hintKey = `academics.imports.${dataset}Hint`;
  const fileErrorId = `import-${dataset}-file-error`;
  const serverErrorId = `import-${dataset}-server-errors`;

  const onFileChange = (next: File | null) => {
    setFileError(null);
    setServerValidationMessages([]);
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

    setReport(null);
    setServerValidationMessages([]);

    importMutation.mutate(
      { dataset, file },
      {
        onSuccess: (result) => {
          setConfirmOpen(false);
          setServerValidationMessages([]);
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
            const messages = Object.values(error.fields).flat();
            setServerValidationMessages(
              messages.length > 0
                ? messages
                : [error.message || t('common:errors.saveFailed')],
            );
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
                      {report.errors.slice(0, MAX_REPORT_ROWS).map((error) => (
                        <TableRow key={`${error.sheet}-${error.row}`}>
                          <TableCell className="w-24 px-3 py-2 text-2xs text-muted-foreground tabular-nums">
                            {t('academics.imports.reportLocation', {
                              sheet: error.sheet,
                              row: error.row,
                            })}
                          </TableCell>
                          <TableCell className="px-3 py-2 text-sm">
                            {error.message}
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
            aria-invalid={Boolean(fileError || serverValidationMessages.length)}
            aria-describedby={
              fileError
                ? fileErrorId
                : serverValidationMessages.length > 0
                  ? serverErrorId
                  : undefined
            }
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
            <p id={fileErrorId} role="alert" className="text-sm text-destructive">
              {fileError}
            </p>
          )}
          {serverValidationMessages.length > 0 && (
            <div
              id={serverErrorId}
              role="alert"
              className="space-y-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
            >
              <p className="font-medium">
                {t('academics.imports.validationErrorTitle')}
              </p>
              <p>{t('academics.imports.validationErrorContext')}</p>
              <ul className="max-h-48 list-disc space-y-1 overflow-y-auto ps-5">
                {serverValidationMessages.map((message, index) => (
                  <li key={`${index}-${message}`}>{message}</li>
                ))}
              </ul>
            </div>
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
