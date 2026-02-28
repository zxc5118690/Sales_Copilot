import React, { useState, useEffect } from 'react';
import { getDataSourceMode, setDataSourceMode } from '../services/api';

const Settings = () => {
    const [mode, setMode] = useState('mock');

    useEffect(() => {
        setMode(getDataSourceMode());
    }, []);

    const handleModeChange = (newMode) => {
        if (newMode === mode) return;

        const password = prompt("切換模式需要密碼：");
        if (password !== "1109") {
            alert("密碼錯誤！");
            return;
        }

        if (confirm(`Switch to ${newMode === 'real' ? 'Real API' : 'Mock Data'} mode? The page will reload.`)) {
            setDataSourceMode(newMode);
        }
    };

    return (
        <div className="container" style={{ maxWidth: '800px' }}>
            <h1 className="page-title">設定 (Settings)</h1>

            <div className="card">
                <h2 className="card-title">資料來源設定 (Data Source)</h2>
                <div style={{ marginBottom: '1rem', color: 'var(--color-text-secondary)' }}>
                    Choose between using static mock data for demonstration or connecting to the real backend API.
                </div>

                <div className="flex gap-md">
                    <button
                        className={`btn ${mode === 'mock' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => handleModeChange('mock')}
                        style={{ flex: 1, padding: '1rem' }}
                    >
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Mock Mode (Demo)</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Uses static data. No backend required.</div>
                    </button>

                    <button
                        className={`btn ${mode === 'real' ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => handleModeChange('real')}
                        style={{ flex: 1, padding: '1rem' }}
                    >
                        <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Real API Mode</div>
                        <div style={{ fontSize: '0.8rem', opacity: 0.8 }}>Connects to local backend (FastAPI).</div>
                    </button>
                </div>

                <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: 'var(--color-background)', borderRadius: 'var(--radius-md)' }}>
                    <strong>Current Status: </strong>
                    <span className={`badge ${mode === 'real' ? 'badge-warning' : 'badge-success'}`}>
                        {mode === 'real' ? 'Connected to Real Backend' : 'Using Mock Data'}
                    </span>
                </div>
            </div>

            <div className="card" style={{ marginTop: 'var(--spacing-lg)', opacity: 0.7 }}>
                <h2 className="card-title">Application Info</h2>
                <div className="grid gap-sm">
                    <div className="flex justify-between">
                        <span>Version</span>
                        <span>v0.1.0 (MVP)</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Environment</span>
                        <span>Development</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
