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
  FileText
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

  // Build navItems based on permissions
  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard', permission: 'dashboard.view' },
    { icon: Users, label: 'Data Atlet', path: '/atlet', permission: 'athletes.view' },
    { icon: Trophy, label: 'Cabor & Prestasi', path: '/cabor', permission: 'cabor.view' },
    { icon: Calendar, label: 'Event Olahraga', path: '/event', permission: 'events.view' },
    { icon: Activity, label: 'Monitoring', path: '/monitoring', permission: 'monitoring.view' },
    { icon: FileText, label: 'Form Builder', path: '/form-builder', permission: 'forms.view' },
    
    // Master Data Menu - Based on permissions
    ...(hasPermission('users.view') || hasPermission('roles.view') || hasPermission('cabors.view') || hasPermission('education_levels.view') ? [
      { 
        icon: Database, 
        label: 'Master Data', 
        path: '#', 
        children: [
          ...(hasPermission('users.view') ? [{ icon: Users, label: 'Data User', path: '/master/users' }] : []),
          ...(hasPermission('roles.view') ? [{ icon: Shield, label: 'Data Role', path: '/master/roles' }] : []),
          ...(hasPermission('cabors.view') ? [{ icon: Trophy, label: 'Master Cabor', path: '/master/cabors' }] : []),
          ...(hasPermission('education_levels.view') ? [{ icon: GraduationCap, label: 'Jenjang Pendidikan', path: '/master/education-levels' }] : []),
        ].filter(Boolean)
      }
    ] : []),

    { icon: Settings, label: 'Pengaturan', path: '/settings', permission: 'settings.view' },
  ].filter(item => {
    // Filter items based on permission
    if (item.permission) {
      return hasPermission(item.permission);
    }
    // Items without permission requirement (like Master Data parent) are shown
    return true;
  });

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
          if (item.children) {
            const hasActiveChild = isChildActive(item.children);
            return (
              <div key={index} className="space-y-1">
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
                        {item.children.map((child, childIndex) => (
                          <Link
                            key={childIndex}
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
              key={index}
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

