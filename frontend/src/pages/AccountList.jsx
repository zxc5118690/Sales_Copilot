import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import DataTable from '../components/DataTable';
import { Plus, Search, Filter, Pencil, Trash2, X } from 'lucide-react';

// ---------- Modal Component ----------
const Modal = ({ title, onClose, children }) => (
    <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={onClose}>
        <div className="card" style={{ width: '520px', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>{title}</h2>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={20} /></button>
            </div>
            {children}
        </div>
    </div>
);

// ---------- Account Form ----------
const SEGMENTS = ['WAFER_FAB', 'PACKAGING_TEST', 'INSPECTION_METROLOGY', 'FACTORY_AUTOMATION', 'DISPLAY', 'SEMICON', 'OTHER'];
const TIERS = ['T1', 'T2', 'T3'];

const AccountForm = ({ initial, onSubmit, onCancel, isSubmitting }) => {
    const [form, setForm] = useState({
        company_name: '', segment: 'WAFER_FAB', region: '', website: '', priority_tier: 'T3', source: 'manual',
        ...initial
    });

    const handleChange = (key, value) => setForm(prev => ({ ...prev, [key]: value }));

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.company_name.trim()) return alert('請輸入公司名稱');
        onSubmit(form);
    };

    const inputStyle = {
        width: '100%', padding: '0.5rem 0.75rem',
        borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
        fontSize: '0.875rem', backgroundColor: 'var(--color-background)', color: 'var(--color-text)'
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="flex-col gap-md">
                <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>公司名稱 *</label>
                    <input style={inputStyle} value={form.company_name} onChange={e => handleChange('company_name', e.target.value)} placeholder="e.g. ASE Technology" required />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>領域 (Segment)</label>
                        <select style={inputStyle} value={form.segment} onChange={e => handleChange('segment', e.target.value)}>
                            {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>優先級 (Priority)</label>
                        <select style={inputStyle} value={form.priority_tier} onChange={e => handleChange('priority_tier', e.target.value)}>
                            {TIERS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>地區 (Region)</label>
                    <input style={inputStyle} value={form.region || ''} onChange={e => handleChange('region', e.target.value)} placeholder="e.g. TW, US, JP" />
                </div>
                <div>
                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>網站 (Website)</label>
                    <input style={inputStyle} value={form.website || ''} onChange={e => handleChange('website', e.target.value)} placeholder="https://..." />
                </div>
                <div className="flex gap-md" style={{ marginTop: '0.5rem', justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-secondary" onClick={onCancel}>取消</button>
                    <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                        {isSubmitting ? '儲存中...' : '儲存'}
                    </button>
                </div>
            </div>
        </form>
    );
};

// ---------- AccountList Page ----------
const AccountList = () => {
    const navigate = useNavigate();
    const [accounts, setAccounts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filterSegment, setFilterSegment] = useState('ALL');

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        setIsLoading(true);
        try {
            const data = await api.accounts.list(200);
            setAccounts(data.items || []);
        } catch (error) {
            console.error('Failed to fetch accounts:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (formData) => {
        setIsSubmitting(true);
        try {
            await api.accounts.create(formData);
            setShowCreateModal(false);
            fetchAccounts();
        } catch (error) {
            alert(`新增失敗: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdate = async (formData) => {
        setIsSubmitting(true);
        try {
            await api.accounts.update(editingAccount.id, formData);
            setEditingAccount(null);
            fetchAccounts();
        } catch (error) {
            alert(`更新失敗: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (account) => {
        if (!confirm(`確定刪除 ${account.company_name}？此操作無法復原。`)) return;
        try {
            await api.accounts.delete(account.id);
            fetchAccounts();
        } catch (error) {
            alert(`刪除失敗: ${error.message}`);
        }
    };

    const filteredAccounts = accounts.filter(acc => {
        const matchSearch = acc.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            acc.segment.toLowerCase().includes(searchTerm.toLowerCase());
        const matchSegment = filterSegment === 'ALL' || acc.segment === filterSegment;
        return matchSearch && matchSegment;
    });

    const columns = [
        {
            label: '公司名稱', key: 'company_name', render: (row) => (
                <strong style={{ color: 'var(--color-primary)', cursor: 'pointer' }}>{row.company_name}</strong>
            )
        },
        {
            label: '領域', key: 'segment', render: (row) => (
                <span className="badge" style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                    {row.segment}
                </span>
            )
        },
        { label: '地區', key: 'region' },
        {
            label: '優先級', key: 'priority_tier', render: (row) => {
                let colorClass = '';
                if (row.priority_tier === 'T1') colorClass = 'badge-danger';
                else if (row.priority_tier === 'T2') colorClass = 'badge-warning';
                else colorClass = 'badge-success';
                return <span className={`badge ${colorClass}`}>{row.priority_tier}</span>;
            }
        },
        {
            label: '網站', key: 'website', render: (row) => (
                row.website ? <a href={row.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-primary)' }} onClick={e => e.stopPropagation()}>Link</a> : '-'
            )
        },
        { label: '最後更新', key: 'updated_at', render: (row) => new Date(row.updated_at).toLocaleDateString() },
        {
            label: '操作', key: '_actions', render: (row) => (
                <div className="flex gap-sm" onClick={e => e.stopPropagation()}>
                    <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => setEditingAccount(row)} title="編輯">
                        <Pencil size={14} />
                    </button>
                    <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', color: 'var(--color-danger)' }} onClick={() => handleDelete(row)} title="刪除">
                        <Trash2 size={14} />
                    </button>
                </div>
            )
        }
    ];

    const uniqueSegments = [...new Set(accounts.map(a => a.segment))];

    return (
        <div>
            <div className="page-header flex justify-between items-center">
                <h1 className="page-title">目標客戶列表 (Target Accounts)</h1>
                <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                    <Plus size={18} style={{ marginRight: '0.5rem' }} />
                    新增客戶 (Add)
                </button>
            </div>

            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div className="flex gap-md items-center">
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-secondary)' }} />
                        <input
                            type="text"
                            placeholder="搜尋公司..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem 0.5rem 0.5rem 2.5rem',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--color-border)',
                                fontSize: '0.875rem'
                            }}
                        />
                    </div>
                    <select
                        value={filterSegment}
                        onChange={(e) => setFilterSegment(e.target.value)}
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
                    >
                        <option value="ALL">全部領域</option>
                        {uniqueSegments.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
            </div>

            <DataTable
                columns={columns}
                data={filteredAccounts}
                isLoading={isLoading}
                onRowClick={(row) => navigate(`/accounts/${row.id}`)}
            />

            {/* Create Modal */}
            {showCreateModal && (
                <Modal title="新增客戶 (Add Account)" onClose={() => setShowCreateModal(false)}>
                    <AccountForm onSubmit={handleCreate} onCancel={() => setShowCreateModal(false)} isSubmitting={isSubmitting} />
                </Modal>
            )}

            {/* Edit Modal */}
            {editingAccount && (
                <Modal title={`編輯 ${editingAccount.company_name}`} onClose={() => setEditingAccount(null)}>
                    <AccountForm initial={editingAccount} onSubmit={handleUpdate} onCancel={() => setEditingAccount(null)} isSubmitting={isSubmitting} />
                </Modal>
            )}
        </div>
    );
};

export default AccountList;
