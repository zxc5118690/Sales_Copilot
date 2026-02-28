import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
    LayoutDashboard,
    Users,
    Radar,
    Mail,
    Target,
    BarChart3,
    Settings,
    BookOpen
} from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
    >
        <Icon size={20} />
        <span>{label}</span>
    </NavLink>
);

const Layout = () => {
    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    Sales Copilot
                </div>
                <nav className="flex-col gap-md">
                    <SidebarItem to="/" icon={LayoutDashboard} label="儀表板 (Dashboard)" />
                    <SidebarItem to="/accounts" icon={Users} label="客戶名單 (Accounts)" />
                    <SidebarItem to="/signals" icon={Radar} label="市場雷達 (Market Radar)" />
                    <SidebarItem to="/pains" icon={Target} label="痛點分析 (Pain Extraction)" />
                    <SidebarItem to="/outreach" icon={Mail} label="開發信 (Outreach)" />
                    <SidebarItem to="/pipeline" icon={BarChart3} label="商機漏斗 (Pipeline)" />
                    <SidebarItem to="/knowledge" icon={BookOpen} label="知識庫 (Knowledge Base)" />
                    {/* Spacer to push settings to bottom */}
                    <div style={{ flex: 1 }}></div>
                    <SidebarItem to="/settings" icon={Settings} label="設定 (Settings)" />
                </nav>
            </aside>
            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
