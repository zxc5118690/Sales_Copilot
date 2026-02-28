import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AccountList from './pages/AccountList';
import AccountDetail from './pages/AccountDetail';
import Signals from './pages/Signals';
import Pains from './pages/Pains';
import Outreach from './pages/Outreach';
import Pipeline from './pages/Pipeline';
import Settings from './pages/Settings';
import KnowledgeBase from './pages/KnowledgeBase';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="accounts" element={<AccountList />} />
        <Route path="accounts/:id" element={<AccountDetail />} />
        <Route path="signals" element={<Signals />} />
        <Route path="pains" element={<Pains />} />
        <Route path="outreach" element={<Outreach />} />
        <Route path="pipeline" element={<Pipeline />} />
        <Route path="knowledge" element={<KnowledgeBase />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  );
}

export default App;
