import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import DataTable from '../components/DataTable';
import { Copy, Check, XCircle } from 'lucide-react';

const Outreach = () => {
    const navigate = useNavigate();
    const [drafts, setDrafts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('ALL');

    useEffect(() => {
        fetchDrafts();
    }, []);

    const fetchDrafts = async () => {
        setIsLoading(true);
        try {
            const data = await api.outreach.listGlobal();
            setDrafts(data.items || []);
        } catch (error) {
            console.error('Failed to load drafts', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async (e, text) => {
        e.stopPropagation();
        try { await navigator.clipboard.writeText(text); alert('已複製！'); }
        catch { alert('複製失敗'); }
    };

    const handleStatusChange = async (e, draftId, status) => {
        e.stopPropagation();
        try {
            await api.outreach.updateStatus(draftId, status);
            fetchDrafts();
        } catch (error) { alert('狀態更新失敗: ' + error.message); }
    };

    const filtered = statusFilter === 'ALL' ? drafts : drafts.filter(d => d.status === statusFilter);

    const inputStyle = {
        padding: '0.5rem 0.75rem',
        borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
        fontSize: '0.875rem', backgroundColor: 'var(--color-background)', color: 'var(--color-text)'
    };

    const columns = [
        { label: '客戶', key: 'account_name', render: r => <span style={{ fontWeight: 500, color: 'var(--color-primary)' }}>{r.account_name || '—'}</span> },
        {
            label: '狀態', key: 'status', render: r => (
                <span className={`badge ${r.status === 'APPROVED' ? 'badge-success' : r.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`}>
                    {r.status}
                </span>
            )
        },
        { label: '管道', key: 'channel' },
        { label: '主旨', key: 'subject', render: r => <div style={{ maxWidth: '250px', fontWeight: 500 }}>{r.subject}</div> },
        { label: 'Tone', key: 'tone' },
        { label: '建立日期', key: 'created_at', render: r => new Date(r.created_at).toLocaleString() },
        {
            label: '操作', key: '_actions', render: r => (
                <div className="flex gap-sm">
                    <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={(e) => handleCopy(e, r.body)} title="複製">
                        <Copy size={14} />
                    </button>
                    {r.status === 'DRAFT' && (
                        <>
                            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--color-success)' }} onClick={(e) => handleStatusChange(e, r.id, 'APPROVED')} title="核准">
                                <Check size={14} />
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--color-danger)' }} onClick={(e) => handleStatusChange(e, r.id, 'REJECTED')} title="拒絕">
                                <XCircle size={14} />
                            </button>
                        </>
                    )}
                </div>
            )
        }
    ];

    return (
        <div>
            <div className="page-header flex justify-between items-center">
                <h1 className="page-title">開發信 (Outreach) - 全域草稿</h1>
                <select style={inputStyle} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                    <option value="ALL">全部狀態</option>
                    <option value="DRAFT">待審核 (DRAFT)</option>
                    <option value="APPROVED">已核准 (APPROVED)</option>
                    <option value="REJECTED">已拒絕 (REJECTED)</option>
                </select>
            </div>
            <DataTable
                columns={columns}
                data={filtered}
                isLoading={isLoading}
                onRowClick={(row) => row.account_id && navigate(`/accounts/${row.account_id}?tab=outreach`)}
            />
        </div>
    );
};

export default Outreach;
