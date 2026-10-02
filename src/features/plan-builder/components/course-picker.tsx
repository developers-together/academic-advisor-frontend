import { useTranslation } from 'react-i18next';

import { Combobox } from '@/components/ui/combobox';
import {
  buildCourseTitleIndex,
  useAcademicRecord,
} from '@/lib/api/academic-record';
import type { Plan } from '@/types/domain';

export type CoursePickerProps = {
  plan: Plan;
  disabled?: boolean;
  onSelect: (courseCode: string) => void;
};

export const CoursePicker = ({
  plan,
  disabled = false,
  onSelect,
}: CoursePickerProps) => {
  const { t } = useTranslation('plan');
  const academicRecord = useAcademicRecord();

  const titles = buildCourseTitleIndex(academicRecord.data);
  const planned = new Set(plan.courses.map((course) => course.course_code));
  const options = (academicRecord.data?.prerequisite_map ?? [])
    .filter((entry) => !planned.has(entry.course_code))
    .filter((entry) => entry.state !== 'planned')
    .map((entry) => ({
      value: entry.course_code,
      label:
        `${entry.course_code} ${titles.get(entry.course_code) ?? ''}`.trim(),
      hint: t(`builder.mapState.${entry.state}`),
    }));

  return (
    <Combobox
      options={options}
      placeholder={t('builder.addPlaceholder')}
      ariaLabel={t('builder.addPlaceholder')}
      emptyMessage={(query) => t('builder.addSearchEmpty', { query })}
      disabled={disabled}
      onSelect={onSelect}
    />
  );
};
