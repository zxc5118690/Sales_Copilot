import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import DataTable from '../components/DataTable';
import { Radar, Trash2 } from 'lucide-react';

const signalBadgeStyle = (signalType) => {
    if (signalType === 'HIRING') {
        return { backgroundColor: 'rgba(16,185,129,0.18)', color: '#34d399', border: '1px solid rgba(16,185,129,0.35)' };
    }
    if (signalType === 'CAPEX') {
        return { backgroundColor: 'rgba(245,158,11,0.18)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.35)' };
    }
    if (signalType === 'NPI') {
        return { backgroundColor: 'rgba(59,130,246,0.18)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.35)' };
    }
    return {};
};

const Signals = () => {
    const navigate = useNavigate();
    const [signals, setSignals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [scanning, setScanning] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [deletingSignalId, setDeletingSignalId] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [signalData, accountData] = await Promise.all([
                api.signals.listGlobal(),
                api.accounts.list(200)
            ]);
            setSignals(signalData.items || []);
            setAccounts(accountData.items || []);
        } catch (error) {
            console.error('Failed to load signals', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleScanAll = async () => {
        if (accounts.length === 0) return alert('沒有帳號可以掃描');
        if (!confirm(`掃描全部 ${accounts.length} 個帳號的市場訊號？這可能需要數分鐘。`)) return;
        setScanning(true);
        try {
            const accountIds = accounts.map(a => a.id);
            const result = await api.signals.scan(accountIds);
            if ((result?.events_created || 0) === 0) {
                alert('掃描完成，但沒有找到符合條件的新訊號。');
            }
            setTimeout(async () => {
                const data = await api.signals.listGlobal();
                setSignals(data.items || []);
                setScanning(false);
            }, 3000);
        } catch (error) {
            alert('掃描失敗: ' + error.message);
            setScanning(false);
        }
    };

    const handleDeleteSignal = async (signalId) => {
        if (!confirm('確定要刪除這筆市場訊號？')) return;
        setDeletingSignalId(signalId);
        try {
            await api.signals.delete(signalId);
            setSignals(prev => prev.filter(item => item.id !== signalId));
        } catch (error) {
            alert('刪除失敗: ' + error.message);
        } finally {
            setDeletingSignalId(null);
        }
    };

    const columns = [
        { label: '客戶', key: 'account_name', render: r => <span style={{ fontWeight: 500, color: 'var(--color-primary)' }}>{r.account_name || '—'}</span> },
        { label: '日期', key: 'event_date' },
        { label: '類型', key: 'signal_type', render: r => <span className="badge badge-warning" style={signalBadgeStyle(r.signal_type)}>{r.signal_type}</span> },
        { label: '強度', key: 'signal_strength' },
        { label: '摘要', key: 'summary', render: r => <div style={{ maxWidth: '400px' }}>{r.summary}</div> },
        {
            label: '來源',
            key: 'source_name',
            render: r => (
                <div style={{ maxWidth: '180px' }}>
                    <div style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{r.source_name || '-'}</div>
                    {r.evidence_url ? <a href={r.evidence_url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }} onClick={e => e.stopPropagation()}>查看來源</a> : '-'}
                </div>
            )
        },
        {
            label: '操作',
            key: 'actions',
            render: r => (
                <button
                    className="btn btn-secondary"
                    style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem', color: 'var(--color-danger)' }}
                    onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSignal(r.id);
                    }}
                    disabled={deletingSignalId === r.id}
                >
                    <Trash2 size={12} style={{ marginRight: '0.25rem' }} />
                    {deletingSignalId === r.id ? '刪除中...' : '刪除'}
                </button>
            )
        }
    ];

    return (
        <div>
            <div className="page-header flex justify-between items-center">
                <div>
                    <h1 className="page-title">市場雷達 (Market Radar)</h1>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        招募訊號: {signals.filter(item => item.signal_type === 'HIRING').length} 筆（LinkedIn/104 優先）
                    </div>
                </div>
                <button className="btn btn-primary" onClick={handleScanAll} disabled={scanning}>
                    <Radar size={16} style={{ marginRight: '0.5rem' }} />
                    {scanning ? '掃描中...' : `掃描全部帳號 (${accounts.length})`}
                </button>
            </div>
            <DataTable
                columns={columns}
                data={signals}
                isLoading={isLoading}
                onRowClick={(row) => navigate(`/accounts/${row.account_id}?tab=signals`)}
            />
        </div>
    );
};

export default Signals;
