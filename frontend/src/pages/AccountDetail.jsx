import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import DataTable from '../components/DataTable';
import { ArrowLeft, Radar, Target, Cpu, MessageSquare, Pencil, UserPlus, Copy, Check, XCircle, X, MessageCircle, ArrowUpRight, ArrowDownLeft, Plus, Trash2, BookOpen } from 'lucide-react';

// ---------- Shared Modal ----------
const Modal = ({ title, onClose, children }) => (
    <div style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        backgroundColor: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
    }} onClick={onClose}>
        <div className="card" style={{ width: '480px', maxHeight: '80vh', overflow: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                <h2 style={{ margin: 0 }}>{title}</h2>
                <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }}><X size={20} /></button>
            </div>
            {children}
        </div>
    </div>
);

const inputStyle = {
    width: '100%', padding: '0.5rem 0.75rem',
    borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border)',
    fontSize: '0.875rem', backgroundColor: 'var(--color-background)', color: 'var(--color-text)'
};

const parsePainEvidence = (evidenceRef) => {
    if (!evidenceRef) return { signalIds: [], evidence: [], reasoning: '' };
    try {
        const parsed = JSON.parse(evidenceRef);
        const signalIds = Array.isArray(parsed?.signal_ids) ? parsed.signal_ids : [];
        const evidence = Array.isArray(parsed?.evidence) ? parsed.evidence : [];
        const reasoning = typeof parsed?.reasoning === 'string' ? parsed.reasoning : '';
        return { signalIds, evidence, reasoning };
    } catch {
        return { signalIds: [], evidence: [], reasoning: '' };
    }
};

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

// ---------- Overview Tab ----------
const OverviewTab = ({ account, onAccountUpdated }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);

    const startEdit = () => {
        setForm({
            company_name: account.company_name,
            segment: account.segment,
            region: account.region || '',
            website: account.website || '',
            priority_tier: account.priority_tier || 'T3',
        });
        setIsEditing(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await api.accounts.update(account.id, form);
            setIsEditing(false);
            onAccountUpdated();
        } catch (error) {
            alert(`更新失敗: ${error.message}`);
        } finally {
            setSaving(false);
        }
    };

    if (isEditing) {
        return (
            <div className="card">
                <h2 className="card-title">編輯客戶資訊</h2>
                <div className="flex-col gap-md">
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>公司名稱</label>
                        <input style={inputStyle} value={form.company_name} onChange={e => setForm(f => ({ ...f, company_name: e.target.value }))} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>領域</label>
                            <select style={inputStyle} value={form.segment} onChange={e => setForm(f => ({ ...f, segment: e.target.value }))}>
                                {['WAFER_FAB', 'PACKAGING_TEST', 'INSPECTION_METROLOGY', 'FACTORY_AUTOMATION', 'DISPLAY', 'SEMICON', 'OTHER'].map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>優先級</label>
                            <select style={inputStyle} value={form.priority_tier} onChange={e => setForm(f => ({ ...f, priority_tier: e.target.value }))}>
                                {['T1', 'T2', 'T3'].map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>地區</label>
                        <input style={inputStyle} value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value }))} />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>網站</label>
                        <input style={inputStyle} value={form.website} onChange={e => setForm(f => ({ ...f, website: e.target.value }))} />
                    </div>
                    <div className="flex gap-md" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>取消</button>
                        <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? '儲存中...' : '儲存'}</button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="card">
            <div className="flex justify-between items-center">
                <h2 className="card-title">客戶概覽 (Account Overview)</h2>
                <button className="btn btn-secondary" onClick={startEdit}><Pencil size={14} style={{ marginRight: '0.5rem' }} />編輯</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)', marginTop: '1rem' }}>
                <div><strong>優先級:</strong> {account.priority_tier}</div>
                <div><strong>來源:</strong> {account.source}</div>
                <div><strong>領域:</strong> {account.segment}</div>
                <div><strong>地區:</strong> {account.region || '-'}</div>
                <div><strong>網站:</strong> {account.website ? <a href={account.website} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>{account.website}</a> : '-'}</div>
                <div><strong>建立日期:</strong> {new Date(account.created_at).toLocaleDateString()}</div>
            </div>
        </div>
    );
};

// ---------- OutreachTab ----------
const OutreachTab = ({ accountId }) => {
    const [contacts, setContacts] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [drafts, setDrafts] = useState([]);
    const [loadingContacts, setLoadingContacts] = useState(false);
    const [loadingDrafts, setLoadingDrafts] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [showAddContact, setShowAddContact] = useState(false);
    const [contactForm, setContactForm] = useState({ full_name: '', role_title: '', channel_email: '', channel_linkedin: '' });
    const [savingContact, setSavingContact] = useState(false);
    // Generate options
    const [genChannel, setGenChannel] = useState('EMAIL');
    const [genIntent, setGenIntent] = useState('FIRST_TOUCH');
    const [genTone, setGenTone] = useState('TECHNICAL');

    useEffect(() => { fetchContacts(); }, [accountId]);
    useEffect(() => { if (selectedContact) fetchDrafts(selectedContact.id); else setDrafts([]); }, [selectedContact]);

    const fetchContacts = async () => {
        setLoadingContacts(true);
        try {
            const data = await api.contacts.list(accountId);
            setContacts(data.items || []);
            if (data.items?.length > 0) setSelectedContact(data.items[0]);
        } catch (error) { console.error(error); }
        finally { setLoadingContacts(false); }
    };

    const fetchDrafts = async (contactId) => {
        setLoadingDrafts(true);
        try {
            const data = await api.outreach.listByContact(contactId);
            setDrafts(data.items || []);
        } catch (error) { console.error(error); }
        finally { setLoadingDrafts(false); }
    };

    const handleGenerate = async () => {
        if (!selectedContact) return;
        setGenerating(true);
        try {
            await api.outreach.generate(selectedContact.id, { channel: genChannel, intent: genIntent, tone: genTone });
            // Wait briefly for backend to complete, then fetch
            setTimeout(() => fetchDrafts(selectedContact.id), 1500);
        } catch (error) { alert('生成失敗: ' + error.message); }
        finally { setTimeout(() => setGenerating(false), 1500); }
    };

    const handleCopy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            alert('已複製到剪貼簿！');
        } catch { alert('複製失敗'); }
    };

    const handleStatusChange = async (draftId, status) => {
        try {
            await api.outreach.updateStatus(draftId, status);
            fetchDrafts(selectedContact.id);
        } catch (error) { alert('狀態更新失敗: ' + error.message); }
    };

    const handleAddContact = async (e) => {
        e.preventDefault();
        if (!contactForm.full_name.trim()) return alert('請輸入姓名');
        setSavingContact(true);
        try {
            await api.contacts.create({ ...contactForm, account_id: parseInt(accountId) });
            setShowAddContact(false);
            setContactForm({ full_name: '', role_title: '', channel_email: '', channel_linkedin: '' });
            fetchContacts();
        } catch (error) { alert('新增失敗: ' + error.message); }
        finally { setSavingContact(false); }
    };

    if (loadingContacts) return <div>載入聯絡人中...</div>;

    return (
        <div className="flex gap-lg" style={{ alignItems: 'flex-start' }}>
            {/* Contacts sidebar */}
            <div className="card" style={{ width: '280px', padding: 0, overflow: 'hidden', flexShrink: 0 }}>
                <div style={{ padding: '0.75rem 1rem', background: 'var(--color-background)', borderBottom: '1px solid var(--color-border)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    聯絡人 ({contacts.length})
                    <button className="btn btn-primary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={() => setShowAddContact(true)}>
                        <UserPlus size={14} />
                    </button>
                </div>
                {contacts.length === 0 && <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--color-text-secondary)' }}>尚無聯絡人</div>}
                {contacts.map(contact => (
                    <div
                        key={contact.id}
                        onClick={() => setSelectedContact(contact)}
                        style={{
                            padding: '0.75rem 1rem', cursor: 'pointer',
                            backgroundColor: selectedContact?.id === contact.id ? 'var(--color-background)' : 'transparent',
                            borderLeft: selectedContact?.id === contact.id ? '3px solid var(--color-primary)' : '3px solid transparent'
                        }}
                    >
                        <div style={{ fontWeight: 500 }}>{contact.full_name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{contact.role_title}</div>
                        {contact.channel_email && <div style={{ fontSize: '0.75rem', color: 'var(--color-text-secondary)', marginTop: '0.25rem' }}>{contact.channel_email}</div>}
                    </div>
                ))}
            </div>

            {/* Draft area */}
            <div style={{ flex: 1 }}>
                {selectedContact ? (
                    <>
                        <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                            <h3>{selectedContact.full_name} 的開發信 (Drafts)</h3>
                        </div>

                        {/* Generate form */}
                        <div className="card" style={{ marginBottom: '1rem', padding: '0.75rem 1rem' }}>
                            <div className="flex gap-md items-center" style={{ flexWrap: 'wrap' }}>
                                <select style={{ ...inputStyle, width: 'auto' }} value={genChannel} onChange={e => setGenChannel(e.target.value)}>
                                    <option value="EMAIL">Email</option>
                                    <option value="LINKEDIN">LinkedIn</option>
                                </select>
                                <select style={{ ...inputStyle, width: 'auto' }} value={genIntent} onChange={e => setGenIntent(e.target.value)}>
                                    <option value="FIRST_TOUCH">首次觸及</option>
                                    <option value="FOLLOW_UP">跟進</option>
                                    <option value="REPLY">回覆</option>
                                </select>
                                <select style={{ ...inputStyle, width: 'auto' }} value={genTone} onChange={e => setGenTone(e.target.value)}>
                                    <option value="TECHNICAL">技術型</option>
                                    <option value="CONSULTATIVE">諮詢型</option>
                                    <option value="EXECUTIVE">高管型</option>
                                </select>
                                <button className="btn btn-primary" onClick={handleGenerate} disabled={generating}>
                                    <MessageSquare size={14} style={{ marginRight: '0.35rem' }} />
                                    {generating ? '生成中...' : 'AI 生成草稿'}
                                </button>
                            </div>
                        </div>

                        {/* Drafts list */}
                        {loadingDrafts ? <div>載入草稿...</div> : (
                            <div className="flex-col gap-md">
                                {drafts.map(draft => (
                                    <div key={draft.id} className="card">
                                        <div className="flex justify-between" style={{ marginBottom: '0.5rem' }}>
                                            <div className="flex gap-sm items-center">
                                                <span className="badge badge-warning">{draft.channel}</span>
                                                <span className="badge">{draft.intent}</span>
                                                <span className="badge">{draft.tone}</span>
                                            </div>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{new Date(draft.created_at).toLocaleString()}</span>
                                        </div>
                                        <div style={{ fontWeight: 600, marginBottom: '0.5rem' }}>{draft.subject}</div>
                                        <pre style={{
                                            whiteSpace: 'pre-wrap', fontFamily: 'inherit',
                                            backgroundColor: 'var(--color-background)',
                                            padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem'
                                        }}>
                                            {draft.body}
                                        </pre>
                                        {draft.cta && (
                                            <div style={{ marginBottom: '0.75rem', fontSize: '0.85rem' }}>
                                                <strong>CTA:</strong> {draft.cta}
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                            <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => handleCopy(draft.body)}>
                                                <Copy size={14} style={{ marginRight: '0.35rem' }} />複製
                                            </button>
                                            {draft.status === 'DRAFT' && (
                                                <>
                                                    <button className="btn btn-primary" style={{ fontSize: '0.8rem', backgroundColor: 'var(--color-success)' }} onClick={() => handleStatusChange(draft.id, 'APPROVED')}>
                                                        <Check size={14} style={{ marginRight: '0.35rem' }} />核准
                                                    </button>
                                                    <button className="btn btn-secondary" style={{ fontSize: '0.8rem', color: 'var(--color-danger)' }} onClick={() => handleStatusChange(draft.id, 'REJECTED')}>
                                                        <XCircle size={14} style={{ marginRight: '0.35rem' }} />拒絕
                                                    </button>
                                                </>
                                            )}
                                            <span className={`badge ${draft.status === 'APPROVED' ? 'badge-success' : draft.status === 'REJECTED' ? 'badge-danger' : 'badge-warning'}`} style={{ marginLeft: 'auto' }}>
                                                {draft.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {drafts.length === 0 && <div className="card" style={{ textAlign: 'center' }}>尚無草稿。使用上方表單生成。</div>}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="card" style={{ textAlign: 'center' }}>請先新增聯絡人後再生成開發信。</div>
                )}
            </div>

            {/* Add Contact Modal */}
            {showAddContact && (
                <Modal title="新增聯絡人 (Add Contact)" onClose={() => setShowAddContact(false)}>
                    <form onSubmit={handleAddContact}>
                        <div className="flex-col gap-md">
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>姓名 *</label>
                                <input style={inputStyle} value={contactForm.full_name} onChange={e => setContactForm(f => ({ ...f, full_name: e.target.value }))} required />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>職稱</label>
                                <input style={inputStyle} value={contactForm.role_title} onChange={e => setContactForm(f => ({ ...f, role_title: e.target.value }))} placeholder="e.g. CTO, VP Engineering" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Email</label>
                                <input style={inputStyle} type="email" value={contactForm.channel_email} onChange={e => setContactForm(f => ({ ...f, channel_email: e.target.value }))} />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>LinkedIn</label>
                                <input style={inputStyle} value={contactForm.channel_linkedin} onChange={e => setContactForm(f => ({ ...f, channel_linkedin: e.target.value }))} />
                            </div>
                            <div className="flex gap-md" style={{ justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowAddContact(false)}>取消</button>
                                <button type="submit" className="btn btn-primary" disabled={savingContact}>{savingContact ? '新增中...' : '新增'}</button>
                            </div>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

// ---------- BANTTab ----------
const BANTTab = ({ accountId }) => {
    const [scores, setScores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [scoring, setScoring] = useState(false);

    useEffect(() => { fetchScores(); }, [accountId]);

    const fetchScores = async () => {
        setLoading(true);
        try {
            const data = await api.bant.list(accountId);
            setScores(data.items || []);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const handleScore = async () => {
        setScoring(true);
        try {
            await api.bant.score(accountId);
            fetchScores();
        } catch (error) { alert('評分失敗: ' + error.message); }
        finally { setScoring(false); }
    };

    return (
        <div>
            <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                <h3>BANT 評分紀錄 (Score History)</h3>
                <button className="btn btn-primary" onClick={handleScore} disabled={scoring}>
                    <Target size={16} style={{ marginRight: '0.5rem' }} />
                    {scoring ? '評分中...' : '執行 BANT 評分'}
                </button>
            </div>
            <DataTable
                isLoading={loading}
                data={scores}
                columns={[
                    { label: '日期', key: 'created_at', render: r => new Date(r.created_at).toLocaleDateString() },
                    { label: '評級', key: 'grade', render: r => <span className={`badge ${r.grade === 'A' ? 'badge-success' : r.grade === 'B' ? 'badge-warning' : 'badge-danger'}`}>{r.grade}</span> },
                    { label: '總分', key: 'total_score' },
                    { label: '預算', key: 'budget_score' },
                    { label: '決策權', key: 'authority_score' },
                    { label: '需求', key: 'need_score' },
                    { label: '時程', key: 'timeline_score' },
                    { label: '建議行動', key: 'recommended_next_action' }
                ]}
            />
        </div>
    );
};

// ---------- InteractionTab ----------
const InteractionTab = ({ accountId }) => {
    const [interactions, setInteractions] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [lastResult, setLastResult] = useState(null);
    const [form, setForm] = useState({
        contact_id: '',
        channel: 'EMAIL',
        direction: 'OUTBOUND',
        content_summary: '',
        sentiment: '',
        raw_ref: ''
    });

    useEffect(() => {
        fetchInteractions();
        fetchContacts();
    }, [accountId]);

    const fetchInteractions = async () => {
        setLoading(true);
        try {
            const data = await api.interactions.list(accountId);
            setInteractions(data.items || []);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const fetchContacts = async () => {
        try {
            const data = await api.contacts.list(accountId);
            setContacts(data.items || []);
        } catch (error) { console.error(error); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.contact_id) return alert('請選擇聯絡人');
        if (!form.content_summary.trim()) return alert('請輸入互動摘要');
        setSubmitting(true);
        setLastResult(null);
        try {
            const payload = {
                contact_id: parseInt(form.contact_id),
                channel: form.channel,
                direction: form.direction,
                content_summary: form.content_summary.trim(),
                sentiment: form.sentiment || null,
                raw_ref: form.raw_ref.trim() || null
            };
            const result = await api.interactions.log(payload);
            setLastResult(result);
            setForm(f => ({ ...f, content_summary: '', sentiment: '', raw_ref: '' }));
            setShowForm(false);
            fetchInteractions();
        } catch (error) { alert('記錄失敗: ' + error.message); }
        finally { setSubmitting(false); }
    };

    const sentimentConfig = {
        POSITIVE: { label: '正面', color: 'var(--color-success)', bg: 'rgba(34,197,94,0.12)' },
        NEUTRAL: { label: '中性', color: 'var(--color-text-secondary)', bg: 'rgba(148,163,184,0.12)' },
        NEGATIVE: { label: '負面', color: 'var(--color-danger)', bg: 'rgba(239,68,68,0.12)' },
    };

    const channelLabels = { EMAIL: 'Email', LINKEDIN: 'LinkedIn', MEETING: '會議', CALL: '電話' };
    const directionConfig = {
        OUTBOUND: { label: '我方發出', icon: <ArrowUpRight size={12} /> },
        INBOUND: { label: '對方回覆', icon: <ArrowDownLeft size={12} /> },
    };

    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                <h3>互動回饋紀錄 (Interaction Log)</h3>
                <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
                    <Plus size={16} style={{ marginRight: '0.35rem' }} />
                    {showForm ? '收起表單' : '記錄新互動'}
                </button>
            </div>

            {/* Result toast */}
            {lastResult && (
                <div className="card" style={{
                    marginBottom: '1rem', padding: '0.75rem 1rem',
                    borderLeft: '4px solid var(--color-success)',
                    backgroundColor: 'rgba(34,197,94,0.06)'
                }}>
                    <div className="flex items-center gap-sm">
                        <Check size={16} style={{ color: 'var(--color-success)' }} />
                        <span>互動已記錄！商機階段自動更新為 <strong>{lastResult.pipeline_stage}</strong></span>
                        <button style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-secondary)' }} onClick={() => setLastResult(null)}><X size={14} /></button>
                    </div>
                </div>
            )}

            {/* Form */}
            {showForm && (
                <div className="card" style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ marginTop: 0, marginBottom: '1rem' }}>記錄互動回饋</h4>
                    <form onSubmit={handleSubmit}>
                        <div className="flex-col gap-md">
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>聯絡人 *</label>
                                    <select style={inputStyle} value={form.contact_id} onChange={e => setForm(f => ({ ...f, contact_id: e.target.value }))} required>
                                        <option value="">請選擇...</option>
                                        {contacts.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.role_title})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>管道 (Channel)</label>
                                    <select style={inputStyle} value={form.channel} onChange={e => setForm(f => ({ ...f, channel: e.target.value }))}>
                                        <option value="EMAIL">Email</option>
                                        <option value="LINKEDIN">LinkedIn</option>
                                        <option value="MEETING">會議 (Meeting)</option>
                                        <option value="CALL">電話 (Call)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>方向 (Direction)</label>
                                    <select style={inputStyle} value={form.direction} onChange={e => setForm(f => ({ ...f, direction: e.target.value }))}>
                                        <option value="OUTBOUND">我方發出 (Outbound)</option>
                                        <option value="INBOUND">對方回覆 (Inbound)</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>互動摘要 *</label>
                                <textarea
                                    style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' }}
                                    value={form.content_summary}
                                    onChange={e => setForm(f => ({ ...f, content_summary: e.target.value }))}
                                    placeholder="描述這次互動的內容與重點..."
                                    required
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>對方情緒 (Sentiment)</label>
                                    <select style={inputStyle} value={form.sentiment} onChange={e => setForm(f => ({ ...f, sentiment: e.target.value }))}>
                                        <option value="">未評估</option>
                                        <option value="POSITIVE">🟢 正面 (Positive)</option>
                                        <option value="NEUTRAL">🔘 中性 (Neutral)</option>
                                        <option value="NEGATIVE">🔴 負面 (Negative)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>參考連結 (Reference)</label>
                                    <input
                                        style={inputStyle}
                                        value={form.raw_ref}
                                        onChange={e => setForm(f => ({ ...f, raw_ref: e.target.value }))}
                                        placeholder="Email thread, LinkedIn URL 等"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-md" style={{ justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>取消</button>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>
                                    <MessageCircle size={14} style={{ marginRight: '0.35rem' }} />
                                    {submitting ? '記錄中...' : '提交互動紀錄'}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            )}

            {/* Timeline */}
            {loading ? <div>載入中...</div> : (
                <div style={{ position: 'relative', paddingLeft: '2rem' }}>
                    {/* Timeline line */}
                    {interactions.length > 0 && (
                        <div style={{
                            position: 'absolute', left: '0.6rem', top: '0.5rem', bottom: '0.5rem',
                            width: '2px', backgroundColor: 'var(--color-border)'
                        }} />
                    )}
                    {interactions.map((item) => {
                        const sc = item.sentiment ? sentimentConfig[item.sentiment] : null;
                        const dc = directionConfig[item.direction];
                        return (
                            <div key={item.id} style={{ position: 'relative', marginBottom: '1.25rem' }}>
                                {/* Timeline dot */}
                                <div style={{
                                    position: 'absolute', left: '-2rem', top: '0.75rem',
                                    width: '12px', height: '12px', borderRadius: '50%',
                                    backgroundColor: item.direction === 'INBOUND' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                                    border: '2px solid var(--color-surface)',
                                    transform: 'translateX(calc(0.6rem - 6px))'
                                }} />
                                <div className="card" style={{ padding: '0.875rem 1rem' }}>
                                    <div className="flex justify-between items-center" style={{ marginBottom: '0.5rem' }}>
                                        <div className="flex gap-sm items-center" style={{ flexWrap: 'wrap' }}>
                                            <span className="badge badge-warning" style={{ fontSize: '0.75rem' }}>{channelLabels[item.channel] || item.channel}</span>
                                            <span className="badge" style={{
                                                fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem',
                                                backgroundColor: item.direction === 'INBOUND' ? 'rgba(99,102,241,0.12)' : 'rgba(148,163,184,0.12)',
                                                color: item.direction === 'INBOUND' ? 'var(--color-primary)' : 'var(--color-text-secondary)'
                                            }}>
                                                {dc.icon} {dc.label}
                                            </span>
                                            {sc && (
                                                <span className="badge" style={{ fontSize: '0.75rem', backgroundColor: sc.bg, color: sc.color }}>
                                                    {sc.label}
                                                </span>
                                            )}
                                        </div>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', whiteSpace: 'nowrap' }}>
                                            {new Date(item.occurred_at).toLocaleString()}
                                        </span>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text-secondary)', marginBottom: '0.35rem' }}>
                                        {item.contact_name}
                                    </div>
                                    <div style={{ lineHeight: 1.5 }}>{item.content_summary}</div>
                                    {item.raw_ref && (
                                        <div style={{ marginTop: '0.35rem', fontSize: '0.8rem' }}>
                                            <a href={item.raw_ref} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>參考連結 ↗</a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {interactions.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                            尚無互動紀錄。點擊「記錄新互動」開始記錄客戶回覆與互動。
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// ---------- Main AccountDetail ----------
const AccountDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [account, setAccount] = useState(null);
    const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');
    const [isLoading, setIsLoading] = useState(true);
    const [signals, setSignals] = useState([]);
    const [pains, setPains] = useState([]);
    const [loadingSignals, setLoadingSignals] = useState(false);
    const [loadingPains, setLoadingPains] = useState(false);
    const [deletingSignalId, setDeletingSignalId] = useState(null);
    const [deletingPainId, setDeletingPainId] = useState(null);
    const [editingPain, setEditingPain] = useState(null);
    const [savingPain, setSavingPain] = useState(false);
    const [painForm, setPainForm] = useState({
        persona: 'RD',
        pain_statement: '',
        business_impact: '',
        technical_anchor: '',
        confidence: 0.5,
    });
    const [selectedSignalIds, setSelectedSignalIds] = useState(new Set());
    const [signalAnnotations, setSignalAnnotations] = useState({});

    useEffect(() => { fetchAccountDetails(); }, [id]);
    useEffect(() => {
        if (activeTab === 'signals' && signals.length === 0) fetchSignals();
        if (activeTab === 'pains' && pains.length === 0) fetchPains();
    }, [activeTab]);

    const fetchAccountDetails = async () => {
        try {
            const data = await api.accounts.get(id);
            setAccount(data);
        } catch (error) { console.error('Failed to load account', error); }
        finally { setIsLoading(false); }
    };

    const fetchSignals = async () => {
        setLoadingSignals(true);
        try { const data = await api.signals.list(id); setSignals(data.items || []); }
        catch (error) { console.error(error); }
        finally { setLoadingSignals(false); }
    };

    const fetchPains = async () => {
        setLoadingPains(true);
        try { const data = await api.pains.list(id); setPains(data.items || []); }
        catch (error) { console.error(error); }
        finally { setLoadingPains(false); }
    };

    const handleScanSignals = async () => {
        if (!confirm('開始掃描市場訊號？這可能需要一些時間。')) return;
        setLoadingSignals(true);
        try {
            const result = await api.signals.scan([parseInt(id)]);
            if ((result?.events_created || 0) === 0) {
                alert('掃描完成，但沒有找到符合條件的新訊號。可嘗試增加 lookback days 或稍後再掃描。');
            }
            setTimeout(fetchSignals, 2000);
        } catch (error) { alert('掃描失敗: ' + error.message); setLoadingSignals(false); }
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

    const handleGeneratePainsWithHITL = async () => {
        if (selectedSignalIds.size === 0) return;
        const confirmed = confirm(
            `以 ${selectedSignalIds.size} 筆人工勾選的訊號生成痛點？\nAI 將嚴格基於這些訊號，不會虛構額外資訊。`
        );
        if (!confirmed) return;
        setLoadingPains(true);
        const annotations = {};
        for (const [sid, note] of Object.entries(signalAnnotations)) {
            if (note.trim()) annotations[String(sid)] = note.trim();
        }
        try {
            await api.pains.generate(parseInt(id), {
                signalIds: [...selectedSignalIds],
                userAnnotations: Object.keys(annotations).length > 0 ? annotations : undefined,
            });
            setSelectedSignalIds(new Set());
            setSignalAnnotations({});
            setActiveTab('pains');
            setTimeout(fetchPains, 2000);
        } catch (error) {
            alert('生成失敗: ' + error.message);
            setLoadingPains(false);
        }
    };

    const handleGeneratePains = async () => {
        if (!confirm('使用 AI 生成痛點分析？')) return;
        setLoadingPains(true);
        try {
            await api.pains.generate(parseInt(id));
            setTimeout(fetchPains, 2000);
        } catch (error) { alert('生成失敗: ' + error.message); setLoadingPains(false); }
    };

    const openEditPain = (pain) => {
        setPainForm({
            persona: pain.persona || 'RD',
            pain_statement: pain.pain_statement || '',
            business_impact: pain.business_impact || '',
            technical_anchor: pain.technical_anchor || '',
            confidence: Number.isFinite(pain.confidence) ? pain.confidence : 0.5,
        });
        setEditingPain(pain);
    };

    const handleSavePain = async (event) => {
        event.preventDefault();
        if (!editingPain) return;
        setSavingPain(true);
        try {
            const confidenceValue = parseFloat(painForm.confidence);
            const payload = {
                persona: painForm.persona,
                pain_statement: painForm.pain_statement,
                business_impact: painForm.business_impact,
                technical_anchor: painForm.technical_anchor,
                confidence: Number.isFinite(confidenceValue) ? Math.max(0, Math.min(1, confidenceValue)) : 0.5,
            };
            const updated = await api.pains.update(editingPain.id, payload);
            setPains(prev => prev.map(item => (item.id === updated.id ? updated : item)));
            setEditingPain(null);
        } catch (error) {
            alert('更新失敗: ' + error.message);
        } finally {
            setSavingPain(false);
        }
    };

    const handleDeletePain = async (painId) => {
        if (!confirm('確定要刪除這筆痛點？')) return;
        setDeletingPainId(painId);
        try {
            await api.pains.delete(painId);
            setPains(prev => prev.filter(item => item.id !== painId));
        } catch (error) {
            alert('刪除失敗: ' + error.message);
        } finally {
            setDeletingPainId(null);
        }
    };

    if (isLoading) return <div style={{ paddingTop: '2rem' }}>Loading...</div>;
    if (!account) return <div style={{ paddingTop: '2rem' }}>Account not found</div>;

    const tabs = [
        { key: 'overview', label: '概覽' },
        { key: 'signals', label: '市場訊號' },
        { key: 'pains', label: '痛點分析' },
        { key: 'outreach', label: '開發信' },
        { key: 'interactions', label: '互動回饋' },
        { key: 'bant', label: 'BANT 評分' },
        { key: 'knowledge', label: '知識庫' },
    ];

    return (
        <div>
            <div className="page-header">
                <button onClick={() => navigate('/accounts')} className="btn btn-secondary" style={{ marginBottom: '1rem' }}>
                    <ArrowLeft size={16} style={{ marginRight: '0.5rem' }} /> 返回列表
                </button>
                <h1 className="page-title">{account.company_name}</h1>
                <div style={{ color: 'var(--color-text-secondary)' }}>
                    <span className="badge" style={{ marginRight: '0.5rem' }}>{account.segment}</span>
                    {account.region && <span style={{ marginRight: '0.5rem' }}>• {account.region}</span>}
                    {account.website && <span>• <a href={account.website} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>{account.website}</a></span>}
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-md" style={{ borderBottom: '1px solid var(--color-border)', marginBottom: 'var(--spacing-lg)' }}>
                {tabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            borderBottom: activeTab === tab.key ? '2px solid var(--color-primary)' : '2px solid transparent',
                            color: activeTab === tab.key ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                            fontWeight: activeTab === tab.key ? 600 : 400,
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'overview' && <OverviewTab account={account} onAccountUpdated={fetchAccountDetails} />}

            {activeTab === 'signals' && (
                <div>
                    <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                        <div>
                            <h3>市場訊號列表</h3>
                            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                                招募訊號: {signals.filter(item => item.signal_type === 'HIRING').length} 筆（LinkedIn/104 優先）
                            </div>
                        </div>
                        <button className="btn btn-primary" onClick={handleScanSignals} disabled={loadingSignals}>
                            <Radar size={16} style={{ marginRight: '0.5rem' }} />
                            {loadingSignals ? '掃描中...' : '掃描新訊號'}
                        </button>
                    </div>
                    {/* HITL CTA banner */}
                    {selectedSignalIds.size > 0 && (
                        <div style={{
                            position: 'sticky', bottom: '1rem',
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))',
                            border: '1px solid rgba(99,102,241,0.4)',
                            borderRadius: 'var(--radius-md)',
                            padding: '0.75rem 1.25rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            marginTop: '1rem', gap: '1rem',
                            backdropFilter: 'blur(8px)',
                        }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--color-text)' }}>
                                <span style={{ fontWeight: 700, color: 'var(--color-primary)' }}>✓ {selectedSignalIds.size} 筆訊號已確認</span>
                                &nbsp;— AI 將嚴格 Based on 你選定的訊號生成痛點，不會虛構額外資訊。
                            </div>
                            <button
                                className="btn btn-primary"
                                onClick={handleGeneratePainsWithHITL}
                                disabled={loadingPains}
                                style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                            >
                                <Cpu size={14} style={{ marginRight: '0.5rem' }} />
                                {loadingPains ? '生成中...' : `以 ${selectedSignalIds.size} 筆訊號生成痛點`}
                            </button>
                        </div>
                    )}

                    {/* Signals list */}
                    {loadingSignals ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>掃描中，請稍候...</div>
                    ) : signals.length === 0 ? (
                        <div className="card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                            尚無訊號。點擊「掃描新訊號」開始。
                        </div>
                    ) : (
                        <div className="flex-col gap-md">
                            {signals.map(sig => {
                                const isSelected = selectedSignalIds.has(sig.id);
                                return (
                                    <div
                                        key={sig.id}
                                        className="card"
                                        style={{
                                            borderLeft: isSelected
                                                ? '4px solid var(--color-primary)'
                                                : '4px solid transparent',
                                            backgroundColor: isSelected
                                                ? 'rgba(99,102,241,0.06)'
                                                : undefined,
                                            transition: 'border-color 0.2s, background-color 0.2s',
                                            cursor: 'default',
                                        }}
                                    >
                                        <div className="flex" style={{ gap: '0.75rem', alignItems: 'flex-start' }}>
                                            {/* Checkbox */}
                                            <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={e => {
                                                    setSelectedSignalIds(prev => {
                                                        const next = new Set(prev);
                                                        e.target.checked ? next.add(sig.id) : next.delete(sig.id);
                                                        return next;
                                                    });
                                                }}
                                                style={{ marginTop: '0.2rem', width: '16px', height: '16px', cursor: 'pointer', accentColor: 'var(--color-primary)', flexShrink: 0 }}
                                            />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                {/* Signal meta row */}
                                                <div className="flex" style={{ gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap', marginBottom: '0.35rem' }}>
                                                    <span className="badge badge-warning" style={signalBadgeStyle(sig.signal_type)}>{sig.signal_type}</span>
                                                    <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>{sig.event_date}</span>
                                                    <span style={{ fontSize: '0.82rem', color: 'var(--color-text-secondary)' }}>強度 {sig.signal_strength}/100</span>
                                                    {sig.evidence_url && (
                                                        <a href={sig.evidence_url} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: 'var(--color-primary)' }}>查看來源 ↗</a>
                                                    )}
                                                    <button
                                                        className="btn btn-secondary"
                                                        style={{ fontSize: '0.72rem', padding: '0.15rem 0.4rem', color: 'var(--color-danger)', marginLeft: 'auto' }}
                                                        onClick={() => handleDeleteSignal(sig.id)}
                                                        disabled={deletingSignalId === sig.id}
                                                    >
                                                        <Trash2 size={11} style={{ marginRight: '0.2rem' }} />
                                                        {deletingSignalId === sig.id ? '刪除中...' : '刪除'}
                                                    </button>
                                                </div>

                                                {/* Summary */}
                                                <div style={{ lineHeight: 1.5, marginBottom: '0.35rem' }}>{sig.summary}</div>
                                                {sig.source_name && (
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{sig.source_name}</div>
                                                )}

                                                {/* 業務員備註 - 只在勾選時顯示 */}
                                                {isSelected && (
                                                    <div style={{ marginTop: '0.6rem' }}>
                                                        <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-primary)', marginBottom: '0.25rem' }}>
                                                            ✎ 業務員備註（選填）— AI 將參考此評語生成痛點
                                                        </label>
                                                        <input
                                                            type="text"
                                                            style={{
                                                                ...inputStyle,
                                                                fontSize: '0.85rem',
                                                                borderColor: 'rgba(99,102,241,0.5)',
                                                            }}
                                                            placeholder="例：此為明確擴產訊號，高度相關，優先列入提案依據"
                                                            value={signalAnnotations[sig.id] || ''}
                                                            onChange={e => setSignalAnnotations(prev => ({ ...prev, [sig.id]: e.target.value }))}
                                                        />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'pains' && (
                <div>
                    <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                        <h3>AI 痛點分析</h3>
                        <button className="btn btn-primary" onClick={handleGeneratePains} disabled={loadingPains}>
                            <Target size={16} style={{ marginRight: '0.5rem' }} />
                            {loadingPains ? '生成中...' : '生成痛點'}
                        </button>
                    </div>
                    <div className="flex-col gap-md">
                        {loadingPains ? <div>載入中...</div> : pains.map(pain => {
                            const evidenceMeta = parsePainEvidence(pain.evidence_ref);
                            return (
                                <div key={pain.id} className="card">
                                    <div className="flex justify-between">
                                        <div className="flex items-center gap-md">
                                            <span className="badge badge-success">{pain.persona}</span>
                                            <span style={{ fontWeight: 600 }}>信心: {(pain.confidence * 100).toFixed(0)}%</span>
                                        </div>
                                        <div className="flex items-center gap-sm">
                                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{new Date(pain.created_at).toLocaleDateString()}</span>
                                            <button className="btn btn-secondary" style={{ fontSize: '0.75rem', padding: '0.2rem 0.45rem' }} onClick={() => openEditPain(pain)}>
                                                <Pencil size={12} style={{ marginRight: '0.2rem' }} />
                                                編輯
                                            </button>
                                            <button
                                                className="btn btn-secondary"
                                                style={{ fontSize: '0.75rem', padding: '0.2rem 0.45rem', color: 'var(--color-danger)' }}
                                                onClick={() => handleDeletePain(pain.id)}
                                                disabled={deletingPainId === pain.id}
                                            >
                                                <Trash2 size={12} style={{ marginRight: '0.2rem' }} />
                                                {deletingPainId === pain.id ? '刪除中...' : '刪除'}
                                            </button>
                                        </div>
                                    </div>
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <div style={{ fontWeight: 600 }}>痛點:</div>
                                        <p>{pain.pain_statement}</p>
                                    </div>
                                    <div style={{ marginTop: '0.5rem' }}>
                                        <div style={{ fontWeight: 600 }}>影響:</div>
                                        <p>{pain.business_impact}</p>
                                    </div>
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                                        Target: {pain.technical_anchor}
                                    </div>
                                    <div style={{ marginTop: '0.75rem', borderTop: '1px solid var(--color-border)', paddingTop: '0.75rem' }}>
                                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>判斷依據:</div>
                                        {evidenceMeta.evidence.length === 0 && (
                                            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>沒有可追溯的市場訊號。</div>
                                        )}
                                        {evidenceMeta.evidence.map((item) => (
                                            <div key={item.signal_id} style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>
                                                <div style={{ fontWeight: 500 }}>
                                                    [S{item.signal_id}] {item.signal_type} ({item.signal_strength}/100)
                                                </div>
                                                <div style={{ color: 'var(--color-text-secondary)' }}>{item.summary}</div>
                                                {item.evidence_url && (
                                                    <a href={item.evidence_url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>
                                                        查看來源
                                                    </a>
                                                )}
                                            </div>
                                        ))}
                                        {evidenceMeta.reasoning && (
                                            <div style={{ marginTop: '0.25rem', color: 'var(--color-text-secondary)', fontSize: '0.85rem' }}>
                                                推論鏈: {evidenceMeta.reasoning}
                                            </div>
                                        )}
                                        <div style={{ marginTop: '0.25rem', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                                            模型: {pain.model_provider || '-'} {pain.llm_fallback_used ? '(fallback)' : ''}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {pains.length === 0 && !loadingPains && <div style={{ textAlign: 'center', padding: '2rem' }}>尚無痛點資料。點擊「生成痛點」開始分析。</div>}
                    </div>
                </div>
            )}

            {activeTab === 'outreach' && <OutreachTab accountId={id} />}
            {activeTab === 'interactions' && <InteractionTab accountId={id} />}
            {activeTab === 'bant' && <BANTTab accountId={id} />}
            {activeTab === 'knowledge' && <KnowledgeTab accountId={id} />}

            {editingPain && (
                <Modal title={`編輯痛點 #${editingPain.id}`} onClose={() => !savingPain && setEditingPain(null)}>
                    <form onSubmit={handleSavePain} className="flex-col gap-md">
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Persona</label>
                            <select
                                style={inputStyle}
                                value={painForm.persona}
                                onChange={(e) => setPainForm(f => ({ ...f, persona: e.target.value }))}
                                disabled={savingPain}
                            >
                                <option value="RD">RD</option>
                                <option value="NPI">NPI</option>
                                <option value="PROCUREMENT">PROCUREMENT</option>
                                <option value="QA">QA</option>
                                <option value="PROCESS">PROCESS</option>
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>痛點</label>
                            <textarea
                                style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
                                value={painForm.pain_statement}
                                onChange={(e) => setPainForm(f => ({ ...f, pain_statement: e.target.value }))}
                                disabled={savingPain}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>影響</label>
                            <textarea
                                style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
                                value={painForm.business_impact}
                                onChange={(e) => setPainForm(f => ({ ...f, business_impact: e.target.value }))}
                                disabled={savingPain}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>Target</label>
                            <textarea
                                style={{ ...inputStyle, minHeight: '72px', resize: 'vertical' }}
                                value={painForm.technical_anchor}
                                onChange={(e) => setPainForm(f => ({ ...f, technical_anchor: e.target.value }))}
                                disabled={savingPain}
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>信心 (0~1)</label>
                            <input
                                style={inputStyle}
                                type="number"
                                min="0"
                                max="1"
                                step="0.01"
                                value={painForm.confidence}
                                onChange={(e) => setPainForm(f => ({ ...f, confidence: e.target.value }))}
                                disabled={savingPain}
                                required
                            />
                        </div>
                        <div className="flex gap-md" style={{ justifyContent: 'flex-end' }}>
                            <button type="button" className="btn btn-secondary" onClick={() => setEditingPain(null)} disabled={savingPain}>取消</button>
                            <button type="submit" className="btn btn-primary" disabled={savingPain}>{savingPain ? '儲存中...' : '儲存'}</button>
                        </div>
                    </form>
                </Modal>
            )}
        </div>
    );
};

// ---------- KnowledgeTab ----------
const KnowledgeTab = ({ accountId }) => {
    const [docs, setDocs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showAdd, setShowAdd] = useState(false);
    const [addForm, setAddForm] = useState({ title: '', doc_type: 'internal_note', content: '', source_url: '', tags: '' });
    const [saving, setSaving] = useState(false);

    const DOC_TYPES = [
        { value: 'earnings_call', label: '法說會逐字稿' },
        { value: 'analyst_report', label: '分析師報告' },
        { value: 'internal_note', label: '內部備忘錄' },
        { value: 'customer_email', label: '客戶郵件' },
        { value: 'market_intel', label: '市場情報' },
    ];

    const fetchDocs = async () => {
        setLoading(true);
        try {
            const data = await api.knowledgeDocs.listByAccount(accountId);
            setDocs(data.items || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchDocs(); }, [accountId]);

    const handleAdd = async () => {
        if (!addForm.title.trim() || !addForm.content.trim()) { alert('標題與內容為必填'); return; }
        setSaving(true);
        try {
            await api.knowledgeDocs.create({
                ...addForm,
                account_id: parseInt(accountId),
                scope: 'account',
            });
            setAddForm({ title: '', doc_type: 'internal_note', content: '', source_url: '', tags: '' });
            setShowAdd(false);
            fetchDocs();
        } catch (err) { alert('新增失敗: ' + err.message); }
        finally { setSaving(false); }
    };

    const handleDelete = async (doc) => {
        if (!confirm(`確定刪除「${doc.title}」？`)) return;
        await api.knowledgeDocs.delete(doc.id);
        fetchDocs();
    };

    const docTypeLabel = (val) => DOC_TYPES.find((t) => t.value === val)?.label || val;

    return (
        <div>
            <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                <div>
                    <h3 style={{ margin: 0 }}>知識庫文件</h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--color-text-secondary)' }}>
                        此處顯示此客戶專屬 + 全域文件，生成痛點時 LLM 將自動引用
                    </p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowAdd(true)}>
                    <Plus size={14} style={{ marginRight: '0.4rem' }} />新增文件
                </button>
            </div>

            {showAdd && (
                <div className="card" style={{ marginBottom: '1rem' }}>
                    <h4 style={{ margin: '0 0 0.75rem' }}>新增客戶文件</h4>
                    <div className="flex-col gap-md">
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>標題 *</label>
                            <input style={inputStyle} value={addForm.title} onChange={e => setAddForm(f => ({ ...f, title: e.target.value }))} placeholder="例：客戶 2025 Q4 法說會摘要" />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>文件類型</label>
                            <select style={inputStyle} value={addForm.doc_type} onChange={e => setAddForm(f => ({ ...f, doc_type: e.target.value }))}>
                                {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>內容 *</label>
                            <textarea style={{ ...inputStyle, minHeight: '160px', resize: 'vertical', fontFamily: 'inherit' }}
                                value={addForm.content} onChange={e => setAddForm(f => ({ ...f, content: e.target.value }))}
                                placeholder="貼上法說會逐字稿、郵件內容..." />
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>來源 URL（選填）</label>
                                <input style={inputStyle} value={addForm.source_url} onChange={e => setAddForm(f => ({ ...f, source_url: e.target.value }))} placeholder="https://..." />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>標籤（選填）</label>
                                <input style={inputStyle} value={addForm.tags} onChange={e => setAddForm(f => ({ ...f, tags: e.target.value }))} placeholder="capex,2026" />
                            </div>
                        </div>
                        <div className="flex gap-md" style={{ justifyContent: 'flex-end' }}>
                            <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>取消</button>
                            <button className="btn btn-primary" onClick={handleAdd} disabled={saving}>{saving ? '儲存中...' : '儲存'}</button>
                        </div>
                    </div>
                </div>
            )}

            {loading && <p style={{ color: 'var(--color-text-secondary)' }}>載入中...</p>}

            {!loading && docs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-secondary)' }}>
                    <BookOpen size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                    <p>尚無文件，點擊「新增文件」建立客戶專屬知識庫</p>
                </div>
            )}

            <div className="flex-col gap-md">
                {docs.map(doc => (
                    <div key={doc.id} className="card" style={{ padding: '0.875rem 1rem' }}>
                        <div className="flex justify-between items-start">
                            <div style={{ flex: 1 }}>
                                <div className="flex items-center gap-md" style={{ marginBottom: '0.3rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                                    <span style={{ fontSize: '0.75rem', padding: '0.1rem 0.5rem', borderRadius: '999px', backgroundColor: 'rgba(99,102,241,0.15)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)', fontWeight: 600 }}>
                                        {docTypeLabel(doc.doc_type)}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                        {doc.scope === 'global' ? '🌐 全域' : '🔒 此客戶'}
                                    </span>
                                </div>
                                <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>{doc.title}</div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '480px' }}>
                                    {doc.content.slice(0, 100)}{doc.content.length > 100 ? '...' : ''}
                                </div>
                            </div>
                            {doc.scope !== 'global' && (
                                <button onClick={() => handleDelete(doc)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-danger, #ef4444)', marginLeft: '0.75rem' }}>
                                    <Trash2 size={15} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AccountDetail;
