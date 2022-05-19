import {
  ActionListValue,
  ActionIconValue,
  ActionButtonValue,
  TableColumn,
  TableConfig,
} from 'kubeflow';
import { tableConfig } from '../config';

const actionsCol: TableColumn = {
  matHeaderCellDef: '',
  matColumnDef: 'actions',
  value: new ActionListValue([
    new ActionButtonValue({
      name: 'moveto',
      tooltip: $localize`move to this folder`,
      color: 'primary',
      field: 'connectAction',
      text: $localize`move to`,
    }),
    new ActionIconValue({
      name: 'delete',
      tooltip: $localize`Delete Volume`,
      color: 'warn',
      field: 'deleteAction',
      iconReady: 'material:delete',
    }),
  ]),
};

export const defaultConfig: TableConfig = {
  title: tableConfig.title,
  newButtonText: tableConfig.newButtonText,
  columns: tableConfig.columns.concat(actionsCol),
};
