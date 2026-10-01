import * as React from 'react';

export type TableDensity = 'spacious' | 'compact';

const TableDensityContext = React.createContext<TableDensity>('spacious');

export const TableDensityProvider = ({
  density,
  children,
}: {
  density: TableDensity;
  children: React.ReactNode;
}) => {
  return (
    <TableDensityContext.Provider value={density}>
      {children}
    </TableDensityContext.Provider>
  );
};

export const useTableDensity = (): TableDensity =>
  React.useContext(TableDensityContext);
