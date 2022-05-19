import {
  PropertyValue,
  StatusValue,
  ActionListValue,
  ActionIconValue,
  TableConfig,
} from 'kubeflow';

export const tableConfig: TableConfig = {
  columns: [
    {
      matHeaderCellDef: $localize`Status`,
      matColumnDef: 'status',
      textAlignment: 'left',
      style: { width: '1%' },
      value: new StatusValue(),
    },
    {
      matHeaderCellDef: $localize`Name`,
      matColumnDef: 'name',
      style: { width: '15%' },
      value: new PropertyValue({
        field: 'name',
        tooltipField: 'name',
        truncate: true,
      }),
    },
    {
      matHeaderCellDef: $localize`Age`,
      matColumnDef: 'age',
      textAlignment: 'left',
      style: { width: '10%' },
      value: new PropertyValue({
        field: 'age.uptime',
        tooltipField: 'age.timestamp',
      }),
    },
    {
      matHeaderCellDef: $localize`Size`,
      matColumnDef: 'size',
      textAlignment: 'left',
      style: { width: '10%' },
      value: new PropertyValue({ field: 'capacity', truncate: true }),
    },
    {
      matHeaderCellDef: $localize`Type`,
      matColumnDef: 'modes',
      textAlignment: 'left',
      style: { width: '15%' },
      value: new PropertyValue({ field: 'modes', truncate: true }),
    },
    {
      matHeaderCellDef: $localize`URL`,
      matColumnDef: 'class',
      textAlignment: 'left',
      style: { width: '20%' },
      value: new PropertyValue({ field: 'class', truncate: false }),
    },

    // the apps should import the actions they want
  ],
};
