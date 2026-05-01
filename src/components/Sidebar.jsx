import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import { 
  LayoutDashboard, 
  Users, 
  Trophy, 
  Calendar, 
  Settings, 
  X, 
  Activity,
  Database,
  ChevronDown,
  ChevronRight,
  Shield,
  GraduationCap,
  FileText,
  History,
  UserCheck,
  MapPin,
  Building2,
  ClipboardCheck,
  ClipboardList,
  Bot,
  Layers
} from 'lucide-react';
import koniLogo from '../assets/koni-sumbar.jpg';

export function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col fixed h-full z-30">
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
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-50 lg:hidden flex flex-col"
            >
              <div className="p-6 flex items-center justify-between border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1 border border-slate-100">
                    <img src={koniLogo} alt="Logo KONI" className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <h1 className="font-bold text-lg text-slate-800 leading-tight">KONI <span className="text-red-600">SUMBAR</span></h1>
                  </div>
                </div>
                <button 
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-lg text-slate-500"
                >
                  <X className="w-6 h-6" />
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
  
  // Check if user has permission (Super Admin has all)
  const hasPermission = (permission) => {
    if (!user) return false;
    if (user.permissions?.includes('*')) return true;
    return user.permissions?.includes(permission) ?? false;
  };

  // Check if user is Super Admin
  const isSuperAdmin = () => {
    return user?.permissions?.includes('*') || user?.role?.name === 'super_admin';
  };

  // Check if user is Athlete
  const isAthlete = () => {
    return user?.role?.name === 'athlete';
  };

  // Check if user is Coach
  const isCoach = () => {
    return user?.role?.name === 'coach';
  };

  const createSection = (label, items) => {
    if (!items.length) {
      return [];
    }

    return [{ type: 'section', label }, ...items];
  };

  const filterVisibleItems = (items) => items.filter((item) => {
    if (item.permission) {
      return hasPermission(item.permission);
    }

    if (item.children) {
      return item.children.length > 0;
    }

    return true;
  });

  const dashboardItems = filterVisibleItems([
    ...(!isAthlete() && !isCoach()
      ? [{ icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' }]
      : []),
    ...(isAthlete()
      ? [{ icon: LayoutDashboard, label: 'Dashboard', path: '/portal/atlet' }]
      : []),
    ...(isCoach()
      ? [{ icon: LayoutDashboard, label: 'Dashboard', path: '/portal/pelatih' }]
      : []),
  ]);

  const trainingChildren = filterVisibleItems([
    { icon: Calendar, label: 'Jadwal Latihan', path: '/training' },
    ...(hasPermission('training.report') || isSuperAdmin()
      ? [{ icon: Activity, label: 'Laporan Kehadiran', path: '/training/report' }]
      : []),
  ]);

  const pembinaanItems = filterVisibleItems([
    { icon: Users, label: 'Data Atlet', path: '/atlet', permission: 'athletes.view' },
    { icon: UserCheck, label: 'Data Pelatih', path: '/pelatih', permission: 'coaches.view' },
    { icon: UserCheck, label: 'Pelatih-Atlet', path: '/coach-athletes', permission: 'coaching.view' },
    ...(hasPermission('training.view') || isCoach()
      ? [{
          icon: ClipboardCheck,
          label: 'Absensi Latihan',
          path: '#',
          children: trainingChildren,
        }]
      : []),
  ]);

  const kegiatanItems = filterVisibleItems([
    { icon: Calendar, label: 'Event Olahraga', path: '/event', permission: 'events.view' },
    { icon: ClipboardList, label: 'Monitoring', path: '/monev', permission: 'monev.view' },
    { icon: FileText, label: 'Form Builder', path: '/form-builder', permission: 'forms.view' },
  ]);

  const masterDataChildren = filterVisibleItems([
    { icon: Users, label: 'Data User', path: '/master/users', permission: 'users.view' },
    { icon: Shield, label: 'Data Role', path: '/master/roles', permission: 'roles.view' },
    { icon: Trophy, label: 'Master Cabor', path: '/master/cabors', permission: 'cabors.view' },
    { icon: Layers, label: 'Master Cluster Atlet', path: '/master/athlete-clusters', permission: 'athlete_cluster_master.view' },
    { icon: MapPin, label: 'Wilayah', path: '/master/regions', permission: 'regions.view' },
    { icon: Building2, label: 'Organisasi', path: '/master/organizations', permission: 'organizations.view' },
    { icon: GraduationCap, label: 'Jenjang Pendidikan', path: '/master/education-levels', permission: 'education_levels.view' },
    { icon: Trophy, label: 'Kelas Pertandingan', path: '/master/competition-classes', permission: 'competition_classes.view' },
    { icon: MapPin, label: 'Master Venue', path: '/master/venues', permission: 'venues.view' },
  ]).map(({ permission, ...item }) => item);

  const masterDataItems = filterVisibleItems([
    ...(masterDataChildren.length
      ? [{
          icon: Database,
          label: 'Master Data',
          path: '#',
          children: masterDataChildren,
        }]
      : []),
  ]);

  const systemItems = filterVisibleItems([
    ...(isSuperAdmin()
      ? [
          { icon: History, label: 'Activity Log', path: '/activity-logs' },
          { icon: Bot, label: 'AI Analytics', path: '/ai-analytics' },
        ]
      : []),
    { icon: Settings, label: 'Pengaturan', path: '/settings', permission: 'settings.view' },
  ]);

  const navItems = [
    ...createSection('Utama', dashboardItems),
    ...createSection('Pembinaan', pembinaanItems),
    ...createSection('Kegiatan', kegiatanItems),
    ...createSection('Master Data', masterDataItems),
    ...createSection('Sistem', systemItems),
  ];

  const toggleSubmenu = (label) => {
    if (openSubmenu === label) {
      setOpenSubmenu('');
      setManualClose(true);
    } else {
      setOpenSubmenu(label);
      setManualClose(false);
    }
  };

  // Auto-open submenu if child is active (only on route change, not manual close)
  useEffect(() => {
    if (!manualClose) {
      const activeParent = navItems.find(item => item.children && isChildActive(item.children));
      if (activeParent) {
        setOpenSubmenu(activeParent.label);
      }
    }
  }, [location.pathname]);

  return (
    <>
      <div className="lg:block hidden p-6 flex items-center gap-3 border-b border-slate-100">
        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20 p-1 border border-slate-100">
          <img src={koniLogo} alt="Logo KONI" className="w-full h-full object-contain" />
        </div>
        <div>
          <h1 className="font-bold text-lg text-slate-800 leading-tight">KONI <span className="text-red-600">SUMBAR</span></h1>
          <p className="text-[10px] text-slate-400 font-medium tracking-wide">SPORTS MANAGEMENT</p>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item, index) => {
          if (item.type === 'section') {
            return (
              <div
                key={`section-${item.label}`}
                className={index === 0 ? 'px-4 pt-1 pb-2' : 'px-4 pt-5 pb-2'}
              >
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {item.label}
                </p>
              </div>
            );
          }

          if (item.children) {
            const hasActiveChild = isChildActive(item.children);
            return (
              <div key={item.label} className="space-y-1">
                <button
                  onClick={() => toggleSubmenu(item.label)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                    openSubmenu === item.label || hasActiveChild
                      ? 'bg-slate-50 text-slate-900' 
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`w-5 h-5 ${hasActiveChild ? 'text-red-600' : 'text-slate-400'}`} />
                    {item.label}
                  </div>
                  {openSubmenu === item.label ? (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                <AnimatePresence>
                  {openSubmenu === item.label && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                        <div className="pl-4 pr-2 py-1 space-y-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.path}
                              to={child.path}
                              onClick={onNavigate}
                              className={`flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-colors ${
                              isActive(child.path)
                                ? 'text-red-600 bg-red-50 font-medium'
                                : 'text-slate-500 hover:text-red-600 hover:bg-red-50'
                            }`}
                          >
                            <div className={`w-1.5 h-1.5 rounded-full ${isActive(child.path) ? 'bg-red-600' : 'bg-slate-300'}`}></div>
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

          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                active 
                  ? 'bg-red-50 text-red-600 shadow-sm' 
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <item.icon className={`w-5 h-5 ${active ? 'text-red-600' : 'text-slate-400'}`} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}

