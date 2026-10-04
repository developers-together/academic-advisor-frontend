import { zodResolver } from '@hookform/resolvers/zod';
import { FormEvent, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';

import { Banner } from '@/components/ui/banner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/form';
import { useNotifications } from '@/components/ui/notifications';
import { ApiError } from '@/lib/api-error';

import { useUpdateOfficeLocation } from '../api/update-office-location';

const OFFICE_LOCATION_MAX_LENGTH = 255;

export type OfficeLocationFormProps = {
  officeLocation: string | null;
};

export const OfficeLocationForm = ({
  officeLocation,
}: OfficeLocationFormProps) => {
  const { t } = useTranslation('advisor');
  const addNotification = useNotifications((state) => state.addNotification);
  const updateOfficeLocation = useUpdateOfficeLocation();
  const [failed, setFailed] = useState(false);

  const schema = useMemo(
    () =>
      z.object({
        office_location: z
          .string()
          .trim()
          .max(OFFICE_LOCATION_MAX_LENGTH, {
            message: t('profile.errors.maxLength'),
          }),
      }),
    [t],
  );

  const form = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: { office_location: officeLocation ?? '' },
  });

  const submit = form.handleSubmit((values) => {
    setFailed(false);
    updateOfficeLocation.mutate(
      values.office_location === '' ? null : values.office_location,
      {
        onSuccess: () => {
          addNotification({ type: 'success', title: t('profile.success') });
        },
        onError: (error) => {
          if (error instanceof ApiError && error.status === 422) {
            const messages = error.fields.office_location;
            if (messages?.[0]) {
              form.setError('office_location', { message: messages[0] });
            }
            return;
          }
          setFailed(true);
        },
      },
    );
  });

  const onFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void submit();
  };

  return (
    <form onSubmit={onFormSubmit} className="space-y-4" noValidate>
      <Input
        type="text"
        label={t('profile.locationLabel')}
        error={form.formState.errors.office_location}
        registration={form.register('office_location')}
      />

      {failed && (
        <Banner variant="destructive" title={t('common:errors.loadFailed')}>
          {t('common:errors.loadFailedBody')}
        </Banner>
      )}

      <Button
        type="submit"
        isLoading={updateOfficeLocation.isPending}
        disabled={updateOfficeLocation.isPending}
      >
        {t('profile.save')}
      </Button>
    </form>
  );
};
