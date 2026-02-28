import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const Pipeline = () => {
    const navigate = useNavigate();
    const [items, setItems] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchPipeline();
    }, []);

    const fetchPipeline = async () => {
        try {
            const data = await api.pipeline.getBoard();
            setItems(data.items || []);
        } catch (error) {
            console.error('Failed to load pipeline', error);
        } finally {
            setIsLoading(false);
        }
    };

    const STAGES = ['DISCOVERY', 'CONTACTED', 'ENGAGED', 'QUALIFIED', 'TECHNICAL_EVAL', 'NURTURE'];

    if (isLoading) return <div>Loading pipeline...</div>;

    return (
        <div>
            <h1 className="page-title">商機漏斗 (Pipeline Board)</h1>
            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '1rem' }}>
                {STAGES.map(stage => {
                    const stageItems = items.filter(i => i.stage === stage);
                    const totalValue = stageItems.length;

                    return (
                        <div key={stage} style={{ minWidth: '280px', backgroundColor: 'var(--color-surface)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--color-border)' }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                <span>{stage}</span>
                                <span className="badge">{totalValue}</span>
                            </div>
                            <div className="flex-col gap-sm">
                                {stageItems.map(item => (
                                    <div
                                        key={item.account_id}
                                        className="card"
                                        style={{ padding: '0.75rem', fontSize: '0.9rem', cursor: 'pointer', transition: 'box-shadow 0.15s' }}
                                        onClick={() => navigate(`/accounts/${item.account_id}`)}
                                        onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 8px rgba(99,102,241,0.18)'}
                                        onMouseLeave={e => e.currentTarget.style.boxShadow = ''}
                                    >
                                        <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--color-primary)' }}>{item.company_name}</div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)', fontSize: '0.8rem' }}>
                                            <span>{item.owner}</span>
                                            <span>{(item.probability * 100).toFixed(0)}%</span>
                                        </div>
                                        {item.next_action && (
                                            <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--color-border)', fontSize: '0.8rem' }}>
                                                Next: {item.next_action}
                                            </div>
                                        )}
                                        {item.latest_bant_grade && (
                                            <div style={{ marginTop: '0.25rem' }}>
                                                <span className={`badge ${item.latest_bant_grade === 'A' ? 'badge-success' : 'badge-warning'}`}>
                                                    BANT: {item.latest_bant_grade} ({item.latest_bant_score})
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Pipeline;
