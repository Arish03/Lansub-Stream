'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Cpu, 
  Boxes, 
  GitBranch, 
  Workflow, 
  Video, 
  Settings,
  BarChart3,
  Bell,
  Layers,
  Radio,
  ChevronDown,
  ChevronRight,
  Gauge,
  Zap,
  HardDrive
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  children?: { name: string; href: string }[];
}

const NAV_ITEMS: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { 
    name: 'Devices', href: '/devices', icon: Radio,
    children: [
      { name: 'Device Templates', href: '/templates' },
      { name: 'Device Management', href: '/devices' },
      { name: 'Digital Twins', href: '/twins' },
    ]
  },
  { name: 'Device Assets', href: '/assets', icon: Boxes },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Data Pipelines', href: '/pipelines', icon: GitBranch },
  { name: 'Rule Engine', href: '/rules', icon: Workflow },
  { name: 'Alarms', href: '/alarms', icon: Bell },
  { 
    name: 'AI & Vision', href: '/ai', icon: Zap,
    children: [
      { name: 'AI Models', href: '/ai' },
      { name: 'CCTV & Streams', href: '/cctv' },
      { name: 'Video Analytics', href: '/vision' },
    ]
  },
  { name: 'Edge Computing', href: '/edge', icon: HardDrive },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggle = (name: string) => {
    setExpanded(prev => ({ ...prev, [name]: !prev[name] }));
  };

  const isActive = (href: string) => pathname === href;
  const isGroupActive = (item: NavItem) => {
    if (isActive(item.href)) return true;
    return item.children?.some(c => isActive(c.href)) ?? false;
  };

  return (
    <aside className="w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800/60 text-slate-700 dark:text-slate-300 min-h-screen flex flex-col justify-between shrink-0 transition-colors duration-200">
      {/* Brand Header */}
      <div>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-200 dark:border-slate-800/60">
          <div className="relative">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-950" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-wider text-slate-900 dark:text-white leading-none">
              LANSUB <span className="text-cyan-500 dark:text-cyan-400">STREAM</span>
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5 tracking-wide">IoT Platform</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = isGroupActive(item);
            const isExpanded = expanded[item.name] || isGroupActive(item);

            if (item.children) {
              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggle(item.name)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      active
                        ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-[18px] h-[18px]" />
                      <span>{item.name}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="ml-8 mt-1 space-y-0.5 border-l border-slate-200 dark:border-slate-800/60 pl-3">
                      {item.children.map(child => (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={`block px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                            isActive(child.href)
                              ? 'text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 dark:bg-cyan-500/5'
                              : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'
                          }`}
                        >
                          {child.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  active
                    ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shadow-[inset_0_0_0_1px_rgba(34,211,238,0.25)]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800/50'
                }`}
              >
                <Icon className="w-[18px] h-[18px]" />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800/60">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold">
            LS
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-slate-800 dark:text-slate-300 truncate">Lansub Admin</p>
            <p className="text-[10px] text-slate-500 dark:text-slate-600">v0.1.0 • Dev Mode</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
