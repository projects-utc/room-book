// Standard Table & DataTable Components (TypeScript)
import React, { ReactNode } from 'react';
import { EmptyState } from './EmptyState';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  striped?: boolean;
  hover?: boolean;
  bordered?: boolean;
  compact?: boolean;
  responsive?: boolean;
  children: ReactNode;
  containerStyle?: React.CSSProperties;
}

export function Table({
  striped = false,
  hover = true,
  bordered = false,
  compact = false,
  responsive = true,
  children,
  containerStyle,
  style,
  className = '',
  ...rest
}: TableProps) {
  const tableNode = (
    <table
      className={`app-table ${striped ? 'table-striped' : ''} ${hover ? 'table-hover' : ''} ${bordered ? 'table-bordered' : ''} ${compact ? 'table-compact' : ''} ${className}`}
      style={{
        width: '100%',
        borderCollapse: 'collapse',
        fontSize: compact ? '0.82rem' : '0.88rem',
        color: '#1E293B',
        ...style,
      }}
      {...rest}
    >
      {children}
    </table>
  );

  if (responsive) {
    return (
      <div
        className="table-responsive"
        style={{
          width: '100%',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
          ...containerStyle,
        }}
      >
        {tableNode}
      </div>
    );
  }

  return tableNode;
}

export function TableHead({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <thead
      style={{
        background: '#F8FAFC',
        borderBottom: '1px solid #E2E8F0',
        ...style,
      }}
    >
      {children}
    </thead>
  );
}

export function TableBody({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <tbody
      style={{
        divideY: '1px solid #E2E8F0',
        ...style,
      }}
    >
      {children}
    </tbody>
  );
}

export function TableRow({
  children,
  onClick,
  style,
  className = '',
}: {
  children: ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <tr
      onClick={onClick}
      className={className}
      style={{
        borderBottom: '1px solid #F1F5F9',
        cursor: onClick ? 'pointer' : undefined,
        transition: 'background-color 0.15s ease',
        ...style,
      }}
    >
      {children}
    </tr>
  );
}

export function TableHeaderCell({
  children,
  align = 'left',
  width,
  style,
}: {
  children: ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  style?: React.CSSProperties;
}) {
  return (
    <th
      style={{
        padding: '0.75rem 1rem',
        textAlign: align,
        width,
        fontWeight: 700,
        fontSize: '0.8rem',
        color: '#475569',
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </th>
  );
}

export function TableCell({
  children,
  align = 'left',
  width,
  bold = false,
  nowrap = false,
  style,
}: {
  children: ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  bold?: boolean;
  nowrap?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <td
      style={{
        padding: '0.85rem 1rem',
        textAlign: align,
        width,
        fontWeight: bold ? 600 : 400,
        whiteSpace: nowrap ? 'nowrap' : undefined,
        verticalAlign: 'middle',
        ...style,
      }}
    >
      {children}
    </td>
  );
}

export interface Column<T> {
  key: string;
  title: ReactNode;
  align?: 'left' | 'center' | 'right';
  width?: string | number;
  render?: (row: T, index: number) => ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  emptyTitle?: string;
  emptyDescription?: string;
  striped?: boolean;
  compact?: boolean;
  onRowClick?: (item: T) => void;
  style?: React.CSSProperties;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyTitle = 'Không có dữ liệu',
  emptyDescription = 'Chưa có bản ghi nào phù hợp với bộ lọc hiện tại.',
  striped = false,
  compact = false,
  onRowClick,
  style,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return <EmptyState compact title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <Table striped={striped} compact={compact} style={style}>
      <TableHead>
        <TableRow>
          {columns.map(col => (
            <TableHeaderCell key={col.key} align={col.align} width={col.width}>
              {col.title}
            </TableHeaderCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {data.map((row, idx) => (
          <TableRow key={keyExtractor(row, idx)} onClick={onRowClick ? () => onRowClick(row) : undefined}>
            {columns.map(col => (
              <TableCell key={col.key} align={col.align} width={col.width}>
                {col.render ? col.render(row, idx) : (row as any)[col.key]}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
