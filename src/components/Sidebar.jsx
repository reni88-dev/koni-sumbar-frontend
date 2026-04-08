import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Settings, 
  X, 
  Database,
  ChevronDown,
  FileText,
  History,
  UserCheck,
  ClipboardCheck,
  ClipboardList,
  Bot,
} from 'lucide-react';
import koniLogo from '../assets/koni-sumbar.jpg';

export function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-slate-900 flex-col fixed h-full z-30 border-r border-slate-800">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -290 }}
              animate={{ x: 0 }}
              exit={{ x: -290 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-slate-900 shadow-2xl z-50 lg:hidden flex flex-col border-r border-slate-800"
            >
              <div className="px-5 py-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1 shadow-lg shadow-red-600/20">
                    <img src={koniLogo} alt="Logo KONI" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h1 className="font-bold text-base text-white leading-tight">
                      KONI <span className="text-red-500">SUMBAR</span>
                    </h1>
                    <p className="text-[9px] text-slate-500 font-semibold tracking-widest uppercase">Sports Management</p>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <SidebarContent onNavigate={onClose} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

function SidebarContent({ onNavigate }) {
  const { user } = useAuth();
  const location = useLocation();
  const [openSubmenu, setOpenSubmenu] = useState('');
  const [manualClose, setManualClose] = useState(false);

  const isActive = (path) => location.pathname === path;
  const isChildActive = (children) => children?.some(child => location.pathname === child.path);

  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.permissions?.includes('*')) return true;
    return user.permissions?.includes(permission) ?? false;
  };

  const isSuperAdmin = () => user?.permissions?.includes('*') || user?.role?.name === 'super_admin';
  const isAthlete = () => user?.role?.name === 'athlete';
  const isCoach = () => user?.role?.name === 'coach';

  // ═══════════════════════════════
  // BUILD GROUPED NAVIGATION
  // ═══════════════════════════════
  const navGroups = [
    // ▶ UTAMA
    {
      id: 'utama',
      label: 'Utama',
      items: [
        ...(!isAthlete() && !isCoach()
          ? [{ icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' }]
          : []),
        ...(isAthlete()
          ? [{ icon: LayoutDashboard, label: 'Dashboard', path: '/portal/atlet' }]
          : []),
        ...(isCoach()
          ? [{ icon: LayoutDashboard, label: 'Dashboard', path: '/portal/pelatih' }]
          : []),
      ],
    },

    // ▶ MANAJEMEN SDM
    {
      id: 'sdm',
      label: 'Manajemen SDM',
      items: [
        { icon: Users, label: 'Data Atlet', path: '/atlet', permission: 'athletes.view' },
        { icon: UserCheck, label: 'Data Pelatih', path: '/pelatih', permission: 'coaches.view' },
        { icon: UserCheck, label: 'Pelatih-Atlet', path: '/coach-athletes', permission: 'coaching.view' },
        ...(hasPermission('training.view') || isCoach()
          ? [{
              icon: ClipboardCheck,
              label: 'Absensi Latihan',
              path: '#',
              children: [
                { label: 'Jadwal Latihan', path: '/training' },
                ...(hasPermission('training.report') || isSuperAdmin()
                  ? [{ label: 'Laporan Kehadiran', path: '/training/report' }]
                  : []),
              ],
            }]
          : []),
      ].filter(item => !item.permission || hasPermission(item.permission)),
    },

    // ▶ PROGRAM
    {
      id: 'program',
      label: 'Program',
      items: [
        { icon: Calendar, label: 'Event Olahraga', path: '/event', permission: 'events.view' },
        { icon: ClipboardList, label: 'Monitoring', path: '/monev', permission: 'monev.view' },
        { icon: FileText, label: 'Form Builder', path: '/form-builder', permission: 'forms.view' },
      ].filter(item => !item.permission || hasPermission(item.permission)),
    },

    // ▶ DATA REFERENSI (Master Data)
    {
      id: 'referensi',
      label: 'Data Referensi',
      items: [
        ...(hasPermission('users.view') || hasPermission('roles.view') || hasPermission('cabors.view') ||
            hasPermission('education_levels.view') || hasPermission('competition_classes.view') ||
            hasPermission('regions.view') || hasPermission('organizations.view')
          ? [{
              icon: Database,
              label: 'Master Data',
              path: '#',
              children: [
                ...(hasPermission('users.view') ? [{ label: 'Data User', path: '/master/users' }] : []),
                ...(hasPermission('roles.view') ? [{ label: 'Data Role', path: '/master/roles' }] : []),
                ...(hasPermission('cabors.view') ? [{ label: 'Master Cabor', path: '/master/cabors' }] : []),
                ...(hasPermission('regions.view') ? [{ label: 'Wilayah', path: '/master/regions' }] : []),
                ...(hasPermission('organizations.view') ? [{ label: 'Organisasi', path: '/master/organizations' }] : []),
                ...(hasPermission('education_levels.view') ? [{ label: 'Jenjang Pendidikan', path: '/master/education-levels' }] : []),
                ...(hasPermission('competition_classes.view') ? [{ label: 'Kelas Pertandingan', path: '/master/competition-classes' }] : []),
                ...(hasPermission('venues.view') ? [{ label: 'Master Venue', path: '/master/venues' }] : []),
              ].filter(Boolean),
            }]
          : []),
      ],
    },

    // ▶ ANALITIK & SISTEM (Super Admin)
    ...(isSuperAdmin()
      ? [{
          id: 'analitik',
          label: 'Analitik & Sistem',
          items: [
            { icon: Bot, label: 'AI Analytics', path: '/ai-analytics' },
            { icon: History, label: 'Activity Log', path: '/activity-logs' },
          ],
        }]
      : []),

    // ▶ LAINNYA
    {
      id: 'lainnya',
      label: 'Lainnya',
      items: [
        { icon: Settings, label: 'Pengaturan', path: '/settings', permission: 'settings.view' },
      ].filter(item => !item.permission || hasPermission(item.permission)),
    },
  ].filter(group => group.items.length > 0);

  // ═══════════════════════════════
  // SUBMENU LOGIC
  // ═══════════════════════════════
  const toggleSubmenu = (label) => {
    if (openSubmenu === label) {
      setOpenSubmenu('');
      setManualClose(true);
    } else {
      setOpenSubmenu(label);
      setManualClose(false);
    }
  };

  useEffect(() => {
    if (!manualClose) {
      for (const group of navGroups) {
        const activeParent = group.items.find(item => item.children && isChildActive(item.children));
        if (activeParent) {
          setOpenSubmenu(activeParent.label);
          break;
        }
      }
    }
  }, [location.pathname]);

  // ═══════════════════════════════
  // RENDER SINGLE NAV ITEM
  // ═══════════════════════════════
  const renderItem = (item, index) => {
    // — Submenu parent button
    if (item.children) {
      const hasActiveChild = isChildActive(item.children);
      const isOpen = openSubmenu === item.label;
      return (
        <div key={index}>
          <button
            onClick={() => toggleSubmenu(item.label)}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
              isOpen || hasActiveChild
                ? 'bg-slate-800 text-white'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                hasActiveChild
                  ? 'bg-red-600/20 text-red-400'
                  : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-300'
              }`}>
                <item.icon className="w-4 h-4" />
              </div>
              <span>{item.label}</span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </button>

          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.18, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="ml-4 pl-3.5 mt-1 mb-1 border-l border-slate-700/70 space-y-0.5">
                  {item.children.map((child, ci) => (
                    <Link
                      key={ci}
                      to={child.path}
                      onClick={onNavigate}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] transition-all duration-150 ${
                        isActive(child.path)
                          ? 'text-red-400 bg-red-600/10 font-semibold'
                          : 'text-slate-500 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 transition-colors ${
                        isActive(child.path) ? 'bg-red-500' : 'bg-slate-700'
                      }`} />
                      {child.label}
                    </Link>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );
    }

    // — Regular nav link
    const active = isActive(item.path);
    return (
      <Link
        key={index}
        to={item.path}
        onClick={onNavigate}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
          active
            ? 'bg-red-600 text-white shadow-lg shadow-red-600/25'
            : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
        }`}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${
          active
            ? 'bg-white/20 text-white'
            : 'bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-slate-300'
        }`}>
          <item.icon className="w-4 h-4" />
        </div>
        {item.label}
      </Link>
    );
  };

  // ═══════════════════════════════
  // RENDER
  // ═══════════════════════════════
  return (
    <div className="flex flex-col h-full">

      {/* Brand Header — Desktop only */}
      <div className="hidden lg:flex items-center gap-3 px-5 py-5 border-b border-slate-800 flex-shrink-0">
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1 shadow-lg shadow-red-600/20">
            <img src={koniLogo} alt="Logo KONI" className="w-full h-full object-contain" />
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-slate-900" />
        </div>
        <div className="min-w-0">
          <h1 className="font-bold text-[15px] text-white leading-tight tracking-wide">
            KONI <span className="text-red-500">SUMBAR</span>
          </h1>
          <p className="text-[9px] text-slate-500 font-semibold tracking-[0.18em] uppercase mt-0.5">
            Sports Management
          </p>
        </div>
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-5 min-h-0">
        {navGroups.map((group) => (
          <div key={group.id}>
            {/* Section Label */}
            <p className="px-3 mb-2 text-[10px] font-bold text-slate-600 uppercase tracking-[0.16em]">
              {group.label}
            </p>
            {/* Items */}
            <div className="space-y-0.5">
              {group.items.map((item, i) => renderItem(item, i))}
            </div>
          </div>
        ))}
      </nav>

      {/* User Profile Card */}
      {user && (
        <div className="px-3 pb-4 flex-shrink-0">
          <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/40">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-md shadow-red-900/40">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-slate-200 truncate leading-tight">{user?.name || 'User'}</p>
              <p className="text-[10px] text-slate-500 truncate capitalize mt-0.5">
                {user?.role?.name?.replace('_', ' ') || 'User'}
              </p>
            </div>
            <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" title="Online" />
          </div>
        </div>
      )}
    </div>
  );
}
