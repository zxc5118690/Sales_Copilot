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
    BookOpen,
    Zap,
} from 'lucide-react';

const SidebarItem = ({ to, icon: Icon, label }) => (
    <NavLink
        to={to}
        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
    >
        <Icon size={16} />
        <span>{label}</span>
    </NavLink>
);

const Layout = () => {
    return (
        <div className="app-layout">
            <aside className="sidebar">
                {/* Brand */}
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon">
                            <Zap size={14} color="white" />
                        </div>
                        <div>
                            <div className="sidebar-brand">Sales Copilot</div>
                            <div className="sidebar-tagline">半導體設備 AI 助手</div>
                        </div>
                    </div>
                </div>

                {/* Nav */}
                <nav className="sidebar-nav">
                    <SidebarItem to="/" icon={LayoutDashboard} label="儀表板" />
                    <SidebarItem to="/accounts" icon={Users} label="客戶名單" />
                    <SidebarItem to="/signals" icon={Radar} label="市場雷達" />
                    <SidebarItem to="/pains" icon={Target} label="痛點分析" />
                    <SidebarItem to="/outreach" icon={Mail} label="開發信" />
                    <SidebarItem to="/pipeline" icon={BarChart3} label="商機漏斗" />
                    <SidebarItem to="/knowledge" icon={BookOpen} label="知識庫" />

                    {/* Push Settings to bottom */}
                    <div className="sidebar-spacer" />
                    <div className="sidebar-footer">
                        <SidebarItem to="/settings" icon={Settings} label="設定" />
                    </div>
                </nav>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;
