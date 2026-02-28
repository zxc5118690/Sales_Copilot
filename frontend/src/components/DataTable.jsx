import React from 'react';

const DataTable = ({ columns, data, onRowClick, isLoading }) => {
    if (isLoading) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                載入中 (Loading)...
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className="card" style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-secondary)' }}>
                無資料 (No data available).
            </div>
        );
    }

    return (
        <div className="card" style={{ overflowX: 'auto' }}>
            <table className="data-table">
                <thead>
                    <tr>
                        {columns.map((col) => (
                            <th key={col.key || col.label} style={{ width: col.width }}>{col.label}</th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {data.map((row, rowIndex) => (
                        <tr
                            key={row.id || rowIndex}
                            onClick={() => onRowClick && onRowClick(row)}
                            style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                        >
                            {columns.map((col) => (
                                <td key={`${rowIndex}-${col.key || col.label}`}>
                                    {col.render ? col.render(row) : row[col.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default DataTable;
