import { cx } from "@/lib/format";

/**
 * Simple data table.
 * columns: [{ key, header, render?(row), className?, align? }]
 */
export function Table({ columns, rows, rowKey = "id", empty = "No records.", className }) {
  return (
    <div className={cx("overflow-x-auto", className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-slate-50 text-left text-xs uppercase tracking-wide text-muted">
            {columns.map((c) => (
              <th key={c.key} className={cx("px-4 py-2.5 font-semibold", c.align === "right" && "text-right", c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-muted">
                {empty}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row[rowKey]} className="border-b border-border last:border-0 hover:bg-slate-50/60">
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cx("px-4 py-2.5 align-top", c.align === "right" && "text-right tabular-nums", c.className)}
                  >
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
