"use client";

import type {
  ReactNode,
} from "react";

type AppTableColumn<T> = {
  key: string;
  label: string;
  className?: string;
  render: (item: T) => ReactNode;
};

type AppTableProps<T> = {
  items: T[];
  columns: AppTableColumn<T>[];
  getRowKey: (item: T) => string;
  emptyText?: string;
};

export default function AppTable<T>({
  items,
  columns,
  getRowKey,
  emptyText = "Keine Einträge gefunden.",
}: AppTableProps<T>) {
  return (
    <div className="bg-white border border-zinc-200 rounded-3xl shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-zinc-50 border-b border-zinc-200">
            <tr>
              {columns.map(
                (column) => (
                  <th
                    key={column.key}
                    className={`px-5 py-4 font-semibold ${column.className || ""}`}
                  >
                    {column.label}
                  </th>
                )
              )}
            </tr>
          </thead>

          <tbody>
            {items.length === 0 && (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-8 text-zinc-500"
                >
                  {emptyText}
                </td>
              </tr>
            )}

            {items.map(
              (item) => (
                <tr
                  key={getRowKey(item)}
                  className="border-b border-zinc-100 last:border-0 hover:bg-zinc-50"
                >
                  {columns.map(
                    (column) => (
                      <td
                        key={column.key}
                        className={`px-5 py-4 ${column.className || ""}`}
                      >
                        {column.render(
                          item
                        )}
                      </td>
                    )
                  )}
                </tr>
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}