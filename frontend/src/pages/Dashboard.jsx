import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, getDataSourceMode } from '../services/api';

const StatCard = ({ title, value, subtitle, onClick }) => (
    <div className="card" style={{ cursor: onClick ? 'pointer' : 'default' }} onClick={onClick}>
        <div className="card-title">{title}</div>
        <div className="card-value">{value}</div>
        {subtitle && (
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {subtitle}
            </div>
        )}
    </div>
);

const Dashboard = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ accounts: 0, signals: 0, drafts: 0, pipeline: 0 });
    const [recentSignals, setRecentSignals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const mode = getDataSourceMode();

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [accountsData, signalsData, outreachData, pipelineData] = await Promise.all([
                api.accounts.list(200),
                api.signals.listGlobal(10),
                api.outreach.listGlobal(50),
                api.pipeline.getBoard(),
            ]);

            const accounts = accountsData.items || [];
            const signals = signalsData.items || [];
            const drafts = outreachData.items || [];
            const pipeline = pipelineData.items || [];
            const pendingDrafts = drafts.filter(d => d.status === 'DRAFT');

            setStats({
                accounts: accounts.length,
                signals: signals.length,
                drafts: pendingDrafts.length,
                pipeline: pipeline.length,
            });
            setRecentSignals(signals.slice(0, 5));
        } catch (error) {
            console.error('Dashboard load error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div style={{ paddingTop: '2rem' }}>載入中...</div>;

    return (
        <div>
            <div className="page-header flex justify-between items-center">
                <h1 className="page-title">儀表板 (Dashboard)</h1>
                <span className={`badge ${mode === 'real' ? 'badge-success' : 'badge-warning'}`}>
                    {mode === 'real' ? '🟢 Real API' : '🟡 Mock Data'}
                </span>
            </div>

            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: 'var(--spacing-lg)',
                marginBottom: 'var(--spacing-xl)'
            }}>
                <StatCard title="客戶總數" value={stats.accounts} subtitle="Tracked accounts" onClick={() => navigate('/accounts')} />
                <StatCard title="市場訊號" value={stats.signals} subtitle="Recent signals" onClick={() => navigate('/signals')} />
                <StatCard title="待審核草稿" value={stats.drafts} subtitle="Pending outreach" onClick={() => navigate('/outreach')} />
                <StatCard title="商機數量" value={stats.pipeline} subtitle="Pipeline items" onClick={() => navigate('/pipeline')} />
            </div>

            {/* Recent Signals */}
            <div className="card">
                <div className="flex justify-between items-center" style={{ marginBottom: '1rem' }}>
                    <h2 className="card-title" style={{ fontSize: '1.1rem', margin: 0 }}>最新市場訊號</h2>
                    <button className="btn btn-secondary" style={{ fontSize: '0.8rem' }} onClick={() => navigate('/signals')}>查看全部</button>
                </div>
                {recentSignals.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--color-text-secondary)' }}>
                        尚無訊號資料。前往「市場雷達」掃描。
                    </div>
                ) : (
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>日期</th>
                                <th>類型</th>
                                <th>強度</th>
                                <th>摘要</th>
                            </tr>
                        </thead>
                        <tbody>
                            {recentSignals.map((signal, i) => (
                                <tr key={signal.id || i}>
                                    <td>{signal.event_date}</td>
                                    <td><span className="badge badge-warning">{signal.signal_type}</span></td>
                                    <td>{signal.signal_strength}/100</td>
                                    <td style={{ maxWidth: '400px' }}>{signal.summary}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
