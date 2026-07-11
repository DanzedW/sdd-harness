import { Table } from "antd";
import type { TableProps } from "antd";

export function LedgerTable<T extends object>({
  pagination,
  scroll,
  ...props
}: TableProps<T>) {
  return (
    <Table<T>
      bordered
      size="small"
      className="ledger-table"
      scroll={scroll ?? { x: 1200 }}
      pagination={
        pagination === false
          ? false
          : {
              showSizeChanger: true,
              showTotal: (value) => "共 " + value + " 条 Mock 数据",
              ...(typeof pagination === "object" ? pagination : {}),
            }
      }
      {...props}
    />
  );
}
