import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import DataTable from '../components/DataTable';

const Pains = () => {
    const navigate = useNavigate();
    const [pains, setPains] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchPains();
    }, []);

    const fetchPains = async () => {
        try {
            const data = await api.pains.listGlobal();
            setPains(data.items || []);
        } catch (error) {
            console.error('Failed to load pains', error);
        } finally {
            setIsLoading(false);
        }
    };

    const columns = [
        { label: '客戶', key: 'account_name', render: r => <span style={{ fontWeight: 500, color: 'var(--color-primary)' }}>{r.account_name || '—'}</span> },
        { label: 'Persona', key: 'persona', render: r => <span className="badge badge-success">{r.persona}</span> },
        { label: '痛點 (Pain)', key: 'pain_statement', render: r => <div style={{ maxWidth: '300px' }}>{r.pain_statement}</div> },
        { label: '影響 (Impact)', key: 'business_impact', render: r => <div style={{ maxWidth: '300px' }}>{r.business_impact}</div> },
        { label: '信心', key: 'confidence', render: r => `${(r.confidence * 100).toFixed(0)}%` },
        { label: '建立日期', key: 'created_at', render: r => new Date(r.created_at).toLocaleDateString() }
    ];

    return (
        <div>
            <h1 className="page-title">痛點分析 (Pain Extraction) - Global Feed</h1>
            <DataTable
                columns={columns}
                data={pains}
                isLoading={isLoading}
                onRowClick={(row) => navigate(`/accounts/${row.account_id}?tab=pains`)}
            />
        </div>
    );
};

export default Pains;
