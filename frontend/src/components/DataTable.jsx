export default function DataTable({ columns, data, onRowClick }) {
  return (
    <div className="bg-white rounded-lg shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full" style={{ minWidth: '1200px' }}>
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`
                    px-4 py-4 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider
                  `}
                  style={column.width ? { width: column.width, minWidth: column.width } : {}}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-slate-500"
                >
                  No data available
                </td>
              </tr>
            ) : (
              data.map((row, rowIndex) => (
                <tr
                  key={rowIndex}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`
                    transition-colors
                    ${onRowClick ? 'cursor-pointer hover:bg-slate-50' : ''}
                  `}
                >
                  {columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className={`
                        px-4 py-4 text-sm text-slate-900 align-top
                        ${column.nowrap ? 'whitespace-nowrap' : ''}
                        ${column.className || ''}
                      `}
                      style={column.width ? { width: column.width, minWidth: column.width } : {}}
                    >
                      {column.render ? column.render(row) : row[column.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
