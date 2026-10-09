import { useTranslation } from 'react-i18next';
import {
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

export type TrendSeries = {
  key: string;
  label: string;
  points: { term_code: string | null; value: number | null }[];
};

export type TrendChartProps = {
  title: string;
  /** Question the chart answers; rendered as the accessible description. */
  question: string;
  series: TrendSeries[];
  unit?: '%';
  className?: string;
};

const SERIES_COLORS = Array.from(
  { length: 6 },
  (_, index) => `var(--color-chart-${index + 1})`,
);

export const TrendChart = ({
  title,
  question,
  series,
  unit = '%',
  className,
}: TrendChartProps) => {
  const { t } = useTranslation('governance');

  const termCodes =
    series[0]?.points.map((point) => point.term_code ?? '') ?? [];
  const rows = termCodes.map((term, index) => {
    const row: Record<string, string | number | null> = { term };
    for (const line of series) {
      row[line.key] = line.points[index]?.value ?? null;
    }
    return row;
  });

  return (
    <figure className={`min-w-0 ${className ?? ''}`}>
      <figcaption>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{question}</p>
      </figcaption>
      <div className="mt-3 h-64 min-w-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={rows}
            margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
          >
            <XAxis
              dataKey="term"
              tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: 'var(--color-muted-foreground)' }}
              unit={unit}
              width={44}
            />
            <Tooltip
              wrapperClassName="tabular-nums"
              contentStyle={{
                background: 'var(--color-popover)',
                color: 'var(--color-popover-foreground)',
                borderColor: 'var(--color-border)',
                borderRadius: 'var(--radius)',
              }}
            />
            <Legend />
            {series.map((line, index) => (
              <Line
                key={line.key}
                type="monotone"
                dataKey={line.key}
                name={line.label}
                stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
                strokeWidth={2}
                dot={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="sr-only">
        <table>
          <caption>{title}</caption>
          <thead>
            <tr>
              <th scope="col">{t('trends.term')}</th>
              {series.map((line) => (
                <th key={line.key} scope="col">
                  {line.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.term as string}>
                <th scope="row">{row.term}</th>
                {series.map((line) => (
                  <td key={line.key} className="tabular-nums">
                    {row[line.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </figure>
  );
};

TrendChart.displayName = 'TrendChart';
