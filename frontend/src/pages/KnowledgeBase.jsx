import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { BookOpen, Plus, Pencil, Trash2, X } from 'lucide-react';

const DOC_TYPES = [
    { value: 'earnings_call', label: '法說會逐字稿' },
    { value: 'analyst_report', label: '分析師報告' },
    { value: 'internal_note', label: '內部備忘錄' },
    { value: 'customer_email', label: '客戶郵件' },
    { value: 'market_intel', label: '市場情報' },
];

const docTypeLabel = (val) => DOC_TYPES.find((t) => t.value === val)?.label || val;

const docTypeBadgeStyle = (docType) => {
    const map = {
        earnings_call: { backgroundColor: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.3)' },
        analyst_report: { backgroundColor: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)' },
        internal_note: { backgroundColor: 'rgba(245,158,11,0.15)', color: '#fbbf24', border: '1px solid rgba(245,158,11,0.3)' },
        customer_email: { backgroundColor: 'rgba(16,185,129,0.15)', color: '#34d399', border: '1px solid rgba(16,185,129,0.3)' },
        market_intel: { backgroundColor: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' },
    };
    return map[docType] || {};
};

const inputStyle = {
    width: '100%', padding: '0.5rem 0.75rem',
    borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
    fontSize: '0.875rem', backgroundColor: 'var(--color-background)', color: 'var(--color-text)',
    boxSizing: 'border-box',
};

const EMPTY_FORM = {
    title: '', doc_type: 'market_intel', scope: 'global',
    account_id: '', content: '', source_url: '', tags: '', created_by: '',
};

const DocModal = ({ initial, onClose, onSave }) => {
    const [form, setForm] = useState(initial || EMPTY_FORM);
    const [saving, setSaving] = useState(false);

    const set = (key, val) => setForm((f) => ({ ...f, [key]: val }));

    const handleSubmit = async () => {
        if (!form.title.trim() || !form.content.trim()) {
            alert('標題與內容為必填欄位');
            return;
        }
        setSaving(true);
        try {
            const payload = {
                ...form,
                account_id: form.account_id ? parseInt(form.account_id) : null,
            };
            await onSave(payload);
            onClose();
        } catch (err) {
            alert('儲存失敗: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
        }} onClick={onClose}>
            <div className="card" style={{ width: '560px', maxHeight: '85vh', overflow: 'auto' }} onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                    <h2 style={{ margin: 0 }}>{initial ? '編輯文件' : '新增知識庫文件'}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={20} /></button>
                </div>
                <div className="flex-col gap-md">
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>標題 *</label>
                        <input style={inputStyle} value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="例：TSMC 2026 Q1 法說會摘要" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>文件類型 *</label>
                            <select style={inputStyle} value={form.doc_type} onChange={(e) => set('doc_type', e.target.value)}>
                                {DOC_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>範圍</label>
                            <select style={inputStyle} value={form.scope} onChange={(e) => set('scope', e.target.value)}>
                                <option value="global">全域（所有客戶）</option>
                                <option value="account">客戶專屬</option>
                            </select>
                        </div>
                    </div>
                    {form.scope === 'account' && (
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>客戶 ID</label>
                            <input style={inputStyle} type="number" value={form.account_id} onChange={(e) => set('account_id', e.target.value)} placeholder="輸入客戶 ID" />
                        </div>
                    )}
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>內容 *</label>
                        <textarea
                            style={{ ...inputStyle, minHeight: '200px', resize: 'vertical', fontFamily: 'inherit' }}
                            value={form.content}
                            onChange={(e) => set('content', e.target.value)}
                            placeholder="貼上法說會逐字稿、分析師報告、客戶郵件等內容..."
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>來源 URL（選填）</label>
                        <input style={inputStyle} value={form.source_url} onChange={(e) => set('source_url', e.target.value)} placeholder="https://..." />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>標籤（選填）</label>
                            <input style={inputStyle} value={form.tags} onChange={(e) => set('tags', e.target.value)} placeholder="lidar,2026,capex" />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>建立者（選填）</label>
                            <input style={inputStyle} value={form.created_by} onChange={(e) => set('created_by', e.target.value)} placeholder="your_name" />
                        </div>
                    </div>
                    <div className="flex gap-md" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={onClose}>取消</button>
                        <button className="btn btn-primary" onClick={handleSubmit} disabled={saving}>
                            {saving ? '儲存中...' : '儲存'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const KnowledgeBase = () => {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [editDoc, setEditDoc] = useState(null);

    const fetchDocs = async () => {
        setLoading(true);
        try {
            const data = await api.knowledgeDocs.list();
            setDocs(data.items || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDocs(); }, []);

    const handleCreate = async (payload) => {
        await api.knowledgeDocs.create(payload);
        await fetchDocs();
    };

    const handleUpdate = async (payload) => {
        await api.knowledgeDocs.update(editDoc.id, payload);
        await fetchDocs();
    };

    const handleDelete = async (doc) => {
        if (!window.confirm(`確定刪除「${doc.title}」？`)) return;
        await api.knowledgeDocs.delete(doc.id);
        await fetchDocs();
    };

    const openEdit = (doc) => {
        setEditDoc({
            title: doc.title,
            doc_type: doc.doc_type,
            scope: doc.scope,
            account_id: doc.account_id || '',
            content: doc.content,
            source_url: doc.source_url || '',
            tags: doc.tags || '',
            created_by: doc.created_by || '',
            _id: doc.id,
        });
        setShowModal(true);
    };

    return (
        <div>
            <div className="flex justify-between items-center" style={{ marginBottom: '1.5rem' }}>
                <div className="flex items-center gap-md">
                    <BookOpen size={24} style={{ color: 'var(--color-primary)' }} />
                    <div>
                        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700 }}>知識庫 (Knowledge Base)</h1>
                        <p style={{ margin: 0, color: 'var(--color-text-secondary)', fontSize: '0.875rem' }}>
                            上傳法說會逐字稿、分析師報告等資料，LLM 生成痛點時將自動引用
                        </p>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => { setEditDoc(null); setShowModal(true); }}>
                    <Plus size={16} style={{ marginRight: '0.5rem' }} />新增文件
                </button>
            </div>

            {loading && <p style={{ color: 'var(--color-text-secondary)' }}>載入中...</p>}

            {!loading && docs.length === 0 && (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                    <BookOpen size={48} style={{ color: 'var(--color-text-secondary)', marginBottom: '1rem' }} />
                    <p style={{ color: 'var(--color-text-secondary)' }}>尚無知識庫文件，點擊「新增文件」開始建立</p>
                </div>
            )}

            <div className="flex-col gap-md">
                {docs.map((doc) => (
                    <div key={doc.id} className="card" style={{ padding: '1rem 1.25rem' }}>
                        <div className="flex justify-between items-start">
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div className="flex items-center gap-md" style={{ marginBottom: '0.5rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.6rem', borderRadius: '999px', fontWeight: 600, ...docTypeBadgeStyle(doc.doc_type) }}>
                                        {docTypeLabel(doc.doc_type)}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', padding: '0.1rem 0.5rem', borderRadius: '4px' }}>
                                        {doc.scope === 'global' ? '全域' : `客戶 #${doc.account_id}`}
                                    </span>
                                    {doc.tags && doc.tags.split(',').map((tag) => (
                                        <span key={tag} style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-surface)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                            #{tag.trim()}
                                        </span>
                                    ))}
                                </div>
                                <h3 style={{ margin: '0 0 0.25rem', fontSize: '1rem', fontWeight: 600 }}>{doc.title}</h3>
                                <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '600px' }}>
                                    {doc.content.slice(0, 120)}{doc.content.length > 120 ? '...' : ''}
                                </p>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)' }}>
                                    {new Date(doc.created_at).toLocaleDateString()}
                                    {doc.created_by ? ` · ${doc.created_by}` : ''}
                                </span>
                            </div>
                            <div className="flex gap-md" style={{ marginLeft: '1rem', flexShrink: 0 }}>
                                <button onClick={() => openEdit(doc)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
                                    <Pencil size={16} />
                                </button>
                                <button onClick={() => handleDelete(doc)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger, #ef4444)' }}>
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <DocModal
                    initial={editDoc}
                    onClose={() => { setShowModal(false); setEditDoc(null); }}
                    onSave={editDoc ? handleUpdate : handleCreate}
                />
            )}
        </div>
    );
};

export default KnowledgeBase;
