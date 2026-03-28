/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Files, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  X,
  Search,
  Filter,
  ChevronRight,
  FileText,
  Building2,
  User,
  Calendar,
  Activity,
  AlertTriangle,
  Plus,
  Trash2,
  Eye,
  XCircle,
  Printer
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format } from 'date-fns';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

import { Dossier, DossierStatus, DossierType } from './types';
import { STATUS_LABELS, WORKFLOW_TRANSITIONS } from './constants';
import { mockDossiers } from './mockData';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Login';
import UserManagement from './components/UserManagement';
import ChangePassword from './components/ChangePassword';
import { RejectedDossiersList } from './components/RejectedDossiersList';
import { LogOut, Settings, Key, Download } from 'lucide-react';
import { printControlSlip } from './utils/printControlSlip';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Helper Components ---

const Badge = ({ children, variant = 'default' }: { children: React.ReactNode, variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' }) => {
  const variants = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border", variants[variant])}>
      {children}
    </span>
  );
};

const PHASES = [
  { id: 'ALL', label: 'Tất cả hồ sơ', statuses: [] },
  { id: 'RECEIVING', label: 'Tiếp nhận & Phân loại', statuses: ['TIEP_NHAN_HCC', 'TIEP_NHAN_CHI_NHANH', 'NHAP_DNLIS', 'PHAN_LOAI'] },
  { id: 'NO_TAX', label: 'Không Thuế', statuses: ['IN_SO', 'LAP_PHIEU_THAM_TRA', 'THAM_TRA', 'IN_GCN', 'TRINH_KY', 'DONG_DAU'] },
  { id: 'TAX', label: 'Có Thuế', statuses: ['LAP_PHIEU_CHUYEN_THUE', 'CHUYEN_THUE', 'CHO_THONG_BAO_THUE', 'CHO_NOP_TIEN', 'XAC_NHAN_HOAN_THANH_THUE', 'IN_SO_THUE', 'THAM_TRA_THUE', 'IN_THUE', 'KY_THUE'] },
  { id: 'DONE', label: 'Hoàn thành', statuses: ['TRA_KET_QUA'] },
  { id: 'REJECTED', label: 'Hồ sơ trả\n(Không đủ ĐK)', statuses: ['TRA_HO_SO_MOT_CUA'] },
];

// --- Main Application ---

function AppContent() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'dossiers' | 'receiving' | 'users' | 'profile'>('dashboard');
  const [activeReceivingSubTab, setActiveReceivingSubTab] = useState<'form' | 'list' | 'rejected'>('form');
  const [dossiers, setDossiers] = useState<Dossier[]>(mockDossiers);
  const [selectedDossier, setSelectedDossier] = useState<Dossier | null>(null);
  const [selectedDossierIds, setSelectedDossierIds] = useState<string[]>([]);
  const [rejectReason, setRejectReason] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activePhase, setActivePhase] = useState<string>('ALL');
  const [activeStep, setActiveStep] = useState<string>('ALL_STEPS');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleStatusChange = (id: string, newStatus: DossierStatus, type?: DossierType) => {
    setDossiers(prev => prev.map(d => {
      if (d.id === id) {
        const now = new Date().toISOString();
        const newHistory = [
          ...(d.history || []),
          {
            status: newStatus,
            timestamp: now,
            action: `Chuyển sang: ${STATUS_LABELS[newStatus].replace(/\n/g, ' ')}`,
          }
        ];
        return {
          ...d,
          status: newStatus,
          type: type !== undefined ? type : d.type,
          lastUpdated: now,
          history: newHistory,
          errorReason: undefined,
          errorDepartment: undefined,
        };
      }
      return d;
    }));
    setSelectedDossier(null);
  };

  const handleTabChange = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setSelectedDossierIds([]);
  };

  const handleSubTabChange = (subTab: typeof activeReceivingSubTab) => {
    setActiveReceivingSubTab(subTab);
    setSelectedDossierIds([]);
  };

  const handlePhaseChange = (phase: typeof activePhase) => {
    setActivePhase(phase);
    setSelectedDossierIds([]);
  };

  const handleBatchStatusChange = (newStatus: DossierStatus, type?: DossierType) => {
    setDossiers(prev => prev.map(d => {
      if (selectedDossierIds.includes(d.id)) {
        const now = new Date().toISOString();
        const newHistory = [
          ...(d.history || []),
          {
            status: newStatus,
            timestamp: now,
            action: `Chuyển sang: ${STATUS_LABELS[newStatus].replace(/\n/g, ' ')}`,
          }
        ];
        return {
          ...d,
          status: newStatus,
          type: type !== undefined ? type : d.type,
          lastUpdated: now,
          history: newHistory,
          errorReason: undefined,
          errorDepartment: undefined,
        };
      }
      return d;
    }));
    setSelectedDossierIds([]);
  };

  const handleReject = (id: string, reason: string) => {
    setDossiers(prev => prev.map(d => {
      if (d.id === id) {
        const now = new Date().toISOString();
        const newHistory = [
          ...(d.history || []),
          {
            status: 'TRA_HO_SO_MOT_CUA' as DossierStatus,
            timestamp: now,
            action: `Trả hồ sơ: ${reason}`,
            note: `Từ bộ phận: ${STATUS_LABELS[d.status].replace(/\n/g, ' ')}`
          }
        ];
        return {
          ...d,
          status: 'TRA_HO_SO_MOT_CUA',
          lastUpdated: now,
          history: newHistory,
          errorReason: reason,
          errorDepartment: STATUS_LABELS[d.status].replace(/\n/g, ' '),
        };
      }
      return d;
    }));
    setSelectedDossier(null);
    setRejectReason('');
  };

  const handleReceiveDossier = (newDossierData: Partial<Dossier>, print: boolean) => {
    const now = new Date().toISOString();
    const newDossier: Dossier = {
      id: newDossierData.id || `HS-${Math.floor(Math.random() * 100000)}`,
      applicantName: newDossierData.applicantName || 'Chưa cập nhật',
      address: newDossierData.address || 'Chưa cập nhật',
      type: null,
      status: newDossierData.status || 'TIEP_NHAN_HCC',
      submissionDate: newDossierData.submissionDate || now,
      lastUpdated: now,
      history: [{
        status: newDossierData.status || 'TIEP_NHAN_HCC',
        timestamp: now,
        action: 'Tiếp nhận hồ sơ mới',
      }],
      ...newDossierData
    } as Dossier;
    
    setDossiers(prev => [newDossier, ...prev]);
    
    if (print) {
      printControlSlip(newDossier);
    }
  };

  // --- Derived Data for Dashboard ---
  const stats = useMemo(() => {
    const total = dossiers.length;
    const completed = dossiers.filter(d => d.status === 'TRA_KET_QUA').length;
    const rejected = dossiers.filter(d => d.status === 'TRA_HO_SO_MOT_CUA').length;
    const inProgress = total - completed - rejected;
    return { total, completed, rejected, inProgress };
  }, [dossiers]);

  const chartData = useMemo(() => {
    const typeCount = { KHONG_THUE: 0, CO_THUE: 0, CHUA_PHAN_LOAI: 0 };
    dossiers.forEach(d => {
      if (d.type === 'KHONG_THUE') typeCount.KHONG_THUE++;
      else if (d.type === 'CO_THUE') typeCount.CO_THUE++;
      else typeCount.CHUA_PHAN_LOAI++;
    });
    return [
      { name: 'Không Thuế', value: typeCount.KHONG_THUE, color: '#3b82f6' },
      { name: 'Có Thuế', value: typeCount.CO_THUE, color: '#a855f7' },
      { name: 'Chưa phân loại', value: typeCount.CHUA_PHAN_LOAI, color: '#94a3b8' },
    ];
  }, [dossiers]);

  const filteredDossiers = dossiers.filter(d => {
    const matchesSearch = d.id.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.applicantName.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesPhase = true;
    const currentPhase = PHASES.find(p => p.id === activePhase);
    if (activePhase !== 'ALL' && currentPhase) {
      matchesPhase = currentPhase.statuses.includes(d.status);
    }

    let matchesStep = true;
    if (activeStep !== 'ALL_STEPS') {
      matchesStep = d.status === activeStep;
    }

    return matchesSearch && matchesPhase && matchesStep;
  });

  const totalPages = Math.ceil(filteredDossiers.length / itemsPerPage);
  const paginatedDossiers = filteredDossiers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when filters change
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activePhase, activeStep]);

  const currentPhase = PHASES.find(p => p.id === activePhase);

  const phaseCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: dossiers.length };
    PHASES.forEach(phase => {
      if (phase.id !== 'ALL') {
        counts[phase.id] = dossiers.filter(d => phase.statuses.includes(d.status)).length;
      }
    });
    return counts;
  }, [dossiers]);

  const stepCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    dossiers.forEach(d => {
      counts[d.status] = (counts[d.status] || 0) + 1;
    });
    return counts;
  }, [dossiers]);

  if (!user) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-[#f8fafc] text-slate-900 font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shadow-sm z-20 text-slate-300">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-white">
            <Building2 className="w-6 h-6 text-indigo-400" />
            <span className="text-lg font-bold tracking-tight">VPĐKĐĐ System</span>
          </div>
        </div>
        <div className="p-4">
          <p className="px-3 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Menu chính</p>
          <nav className="space-y-1">
            <button
              onClick={() => handleTabChange('dashboard')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                activeTab === 'dashboard' 
                  ? "bg-indigo-600 text-white shadow-sm" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <LayoutDashboard className="w-5 h-5" />
              Bảng điều khiển
            </button>
            <button
              onClick={() => handleTabChange('dossiers')}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                activeTab === 'dossiers' 
                  ? "bg-indigo-600 text-white shadow-sm" 
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Files className="w-5 h-5" />
              Quản lý Hồ sơ
              {stats.inProgress > 0 && (
                <span className={cn(
                  "ml-auto py-0.5 px-2 rounded-full text-xs",
                  activeTab === 'dossiers' ? "bg-indigo-500 text-white" : "bg-slate-800 text-indigo-400"
                )}>
                  {stats.inProgress}
                </span>
              )}
            </button>
            {(user.role === 'admin' || user.role === 'onedoor') && (
              <button
                onClick={() => handleTabChange('receiving')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  activeTab === 'receiving' 
                    ? "bg-indigo-600 text-white shadow-sm" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <FileText className="w-5 h-5" />
                Tiếp nhận Hồ sơ
              </button>
            )}
            {user.role === 'admin' && (
              <button
                onClick={() => handleTabChange('users')}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                  activeTab === 'users' 
                    ? "bg-indigo-600 text-white shadow-sm" 
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <User className="w-5 h-5" />
                Quản lý User
              </button>
            )}
          </nav>
        </div>
        
        <div className="mt-auto p-4 border-t border-slate-800">
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => handleTabChange('profile')}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors text-left"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white font-medium shadow-sm shrink-0">
                {user.fullName.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col overflow-hidden">
                <span className="text-sm font-medium text-slate-200 truncate">{user.fullName}</span>
                <span className="text-xs text-slate-500 capitalize">{user.role}</span>
              </div>
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Đăng xuất
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex justify-between items-center shrink-0 z-10">
          <h2 className="text-xl font-semibold text-slate-800 tracking-tight">
            {activeTab === 'dashboard' ? 'Tổng quan hệ thống' : 
             activeTab === 'dossiers' ? 'Danh sách Hồ sơ' : 
             activeTab === 'receiving' ? 'Tiếp nhận Hồ sơ Mới' :
             activeTab === 'users' ? 'Quản lý Người dùng' :
             'Thông tin Tài khoản'}
          </h2>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <Calendar className="w-4 h-4" />
            {format(new Date(), 'EEEE, dd/MM/yyyy')}
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="w-full">
            {activeTab === 'dashboard' ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard 
                    title="Tổng hồ sơ tiếp nhận" 
                    value={stats.total} 
                    icon={<Files className="w-5 h-5 text-blue-600" />} 
                    trend="+12% tuần này"
                    bgIcon="bg-blue-50"
                  />
                  <StatCard 
                    title="Đang xử lý" 
                    value={stats.inProgress} 
                    icon={<Activity className="w-5 h-5 text-amber-600" />} 
                    bgIcon="bg-amber-50"
                  />
                  <StatCard 
                    title="Đã hoàn thành" 
                    value={stats.completed} 
                    icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />} 
                    trend="Đạt chỉ tiêu"
                    bgIcon="bg-emerald-50"
                  />
                  <StatCard 
                    title="Hồ sơ trả (Không đủ ĐK)" 
                    value={stats.rejected} 
                    icon={<AlertTriangle className="w-5 h-5 text-rose-600" />} 
                    trend="Cần chú ý"
                    trendColor="text-rose-600"
                    bgIcon="bg-rose-50"
                  />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Chart Section */}
                  <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <h3 className="text-base font-semibold text-slate-800 mb-6">Phân loại hồ sơ</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 30, left: 40, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                          <XAxis type="number" hide />
                          <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} />
                          <Tooltip 
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                          <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={32}>
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Recent Errors Section */}
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col">
                    <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
                      <h3 className="text-base font-semibold text-slate-800">Cảnh báo sai sót</h3>
                      <Badge variant="danger">{stats.rejected} vụ</Badge>
                    </div>
                    <div className="flex-1 overflow-auto p-2">
                      {dossiers.filter(d => d.status === 'TRA_HO_SO_MOT_CUA').length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 p-6 text-center">
                          <CheckCircle2 className="w-12 h-12 mb-3 text-emerald-200" />
                          <p className="text-sm">Không có hồ sơ nào bị lỗi gần đây.</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {dossiers.filter(d => d.status === 'TRA_HO_SO_MOT_CUA').slice(0, 5).map(d => (
                            <div key={d.id} className="p-4 hover:bg-slate-50 rounded-xl transition-colors group cursor-pointer" onClick={() => {handleTabChange('dossiers'); setSelectedDossier(d);}}>
                              <div className="flex items-start gap-3">
                                <div className="mt-0.5 p-1.5 bg-rose-100 rounded-md text-rose-600 shrink-0">
                                  <AlertCircle className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{d.id}</h4>
                                  <p className="text-xs text-slate-600 mt-1 line-clamp-2">{d.errorReason}</p>
                                  <p className="text-[11px] text-slate-400 mt-2 font-medium">
                                    Tại: {d.errorDepartment}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'receiving' ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 w-full space-y-6">
                <div className="flex gap-2 border-b border-slate-200 pb-2">
                  <button
                    onClick={() => handleSubTabChange('form')}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                      activeReceivingSubTab === 'form'
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    Tiếp nhận
                  </button>
                  <button
                    onClick={() => handleSubTabChange('list')}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                      activeReceivingSubTab === 'list'
                        ? "bg-indigo-50 text-indigo-700"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    Danh sách tiếp nhận hôm nay
                  </button>
                  <button
                    onClick={() => handleSubTabChange('rejected')}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                      activeReceivingSubTab === 'rejected'
                        ? "bg-rose-50 text-rose-700"
                        : "text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    Hồ sơ trả (Không đủ ĐK)
                  </button>
                </div>
                {activeReceivingSubTab === 'form' ? (
                  <div>
                    <ReceivingForm onSubmit={handleReceiveDossier} user={user} />
                  </div>
                ) : activeReceivingSubTab === 'list' ? (
                  <TodayReceivingList dossiers={dossiers} user={user} />
                ) : (
                  <RejectedDossiersList 
                    dossiers={dossiers} 
                    user={user} 
                    onSelectDossier={setSelectedDossier} 
                    selectedDossierIds={selectedDossierIds}
                    setSelectedDossierIds={setSelectedDossierIds}
                    handleBatchStatusChange={handleBatchStatusChange}
                  />
                )}
              </div>
            ) : activeTab === 'users' ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <UserManagement />
              </div>
            ) : activeTab === 'profile' ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <ChangePassword />
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Phase Tabs */}
                <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] gap-2 mb-2">
                  {PHASES.map(phase => (
                    <button
                      key={phase.id}
                      onClick={() => {
                        handlePhaseChange(phase.id);
                        setActiveStep(phase.statuses.length > 0 ? phase.statuses[0] : 'ALL_STEPS');
                      }}
                      className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-pre-line text-left border",
                        activePhase === phase.id 
                          ? "bg-indigo-600 text-white border-indigo-600 shadow-sm" 
                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                      )}
                    >
                      {phase.label}
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-semibold",
                        activePhase === phase.id ? "bg-indigo-500 text-white" : "bg-slate-100 text-slate-500"
                      )}>
                        {phaseCounts[phase.id]}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Step Tabs (Sub-tabs) */}
                {currentPhase && currentPhase.statuses && currentPhase.statuses.length > 1 && (
                  <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] gap-2 mb-4">
                    {currentPhase.statuses.map(status => (
                      <button
                        key={status}
                        onClick={() => setActiveStep(status)}
                        className={cn(
                          "flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-pre-line text-left",
                          activeStep === status
                            ? "bg-slate-800 text-white"
                            : "bg-slate-200 text-slate-700 hover:bg-slate-300"
                        )}
                      >
                        {STATUS_LABELS[status as DossierStatus]}
                        <span className={cn(
                          "px-1.5 py-0.5 rounded-md text-[10px] font-bold",
                          activeStep === status ? "bg-slate-700 text-white" : "bg-white text-slate-500"
                        )}>
                          {stepCounts[status] || 0}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Search Bar */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6">
                  <div className="relative flex-1 w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Tìm kiếm mã hồ sơ, người nộp..." 
                      className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all bg-slate-50 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Batch Actions */}
                {selectedDossierIds.length > 0 && (
                  <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl mb-4 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
                    <span className="text-indigo-700 font-medium">Đã chọn {selectedDossierIds.length} hồ sơ</span>
                    <div className="flex gap-2">
                      {(() => {
                        const firstSelected = dossiers.find(d => d.id === selectedDossierIds[0]);
                        if (!firstSelected) return null;
                        
                        // Check if all selected have the same status
                        const allSameStatus = selectedDossierIds.every(id => {
                          const d = dossiers.find(d => d.id === id);
                          return d && d.status === firstSelected.status;
                        });

                        if (!allSameStatus) {
                          return <span className="text-sm text-slate-500 mr-2">Vui lòng chọn các hồ sơ cùng trạng thái để thao tác</span>;
                        }

                        const nextSteps = WORKFLOW_TRANSITIONS[firstSelected.status]?.next || [];
                        return (
                          <React.Fragment key="batch-actions">
                            {nextSteps.map(nextStatus => {
                              let type: DossierType | undefined = undefined;
                              if (firstSelected.status === 'PHAN_LOAI') {
                                if (nextStatus === 'IN_SO') type = 'KHONG_THUE';
                                if (nextStatus === 'LAP_PHIEU_CHUYEN_THUE') type = 'CO_THUE';
                              }
                              return (
                                <button
                                  key={nextStatus}
                                  onClick={() => handleBatchStatusChange(nextStatus, type)}
                                  className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                                >
                                  Chuyển: {STATUS_LABELS[nextStatus].replace(/\n/g, ' ')}
                                </button>
                              );
                            })}
                            {WORKFLOW_TRANSITIONS[firstSelected.status]?.reject && (
                              <button
                                onClick={() => handleBatchStatusChange(WORKFLOW_TRANSITIONS[firstSelected.status]!.reject!)}
                                className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors shadow-sm"
                              >
                                Trả hồ sơ
                              </button>
                            )}
                          </React.Fragment>
                        );
                      })()}
                      <button onClick={() => setSelectedDossierIds([])} className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors">Hủy</button>
                    </div>
                  </div>
                )}

                {/* Dossier Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-50/80 text-slate-500 font-medium border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-4 w-12 text-center">
                            <input 
                              type="checkbox" 
                              checked={selectedDossierIds.length === paginatedDossiers.length && paginatedDossiers.length > 0}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDossierIds(paginatedDossiers.map(d => d.id));
                                } else {
                                  setSelectedDossierIds([]);
                                }
                              }}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                            />
                          </th>
                          <th className="px-6 py-4">Mã hồ sơ</th>
                          <th className="px-6 py-4">Người nộp</th>
                          <th className="px-6 py-4">Phân loại</th>
                          <th className="px-6 py-4">Trạng thái</th>
                          <th className="px-6 py-4">Cập nhật</th>
                          <th className="px-6 py-4 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedDossiers.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                              Không tìm thấy hồ sơ nào phù hợp.
                            </td>
                          </tr>
                        ) : paginatedDossiers.map(dossier => (
                          <tr key={dossier.id} className="hover:bg-slate-50/80 transition-colors group">
                            <td className="px-4 py-4 text-center">
                              <input 
                                type="checkbox" 
                                checked={selectedDossierIds.includes(dossier.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDossierIds(prev => [...prev, dossier.id]);
                                  } else {
                                    setSelectedDossierIds(prev => prev.filter(id => id !== dossier.id));
                                  }
                                }}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <span className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">{dossier.id}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 shrink-0">
                                  <User className="w-4 h-4" />
                                </div>
                                <span className="font-medium text-slate-700">{dossier.applicantName}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              {dossier.type === 'KHONG_THUE' ? (
                                <Badge variant="info">Không thuế</Badge>
                              ) : dossier.type === 'CO_THUE' ? (
                                <Badge variant="purple">Có thuế</Badge>
                              ) : (
                                <Badge variant="default">Chưa phân loại</Badge>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <Badge variant={
                                dossier.status === 'TRA_KET_QUA' ? 'success' :
                                dossier.status === 'TRA_HO_SO_MOT_CUA' ? 'danger' : 'warning'
                              }>
                                {STATUS_LABELS[dossier.status].replace(/\n/g, ' ')}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-slate-500 text-xs">
                              {format(new Date(dossier.lastUpdated), 'dd/MM/yyyy HH:mm')}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button 
                                  onClick={() => setSelectedDossier(dossier)}
                                  className="inline-flex items-center justify-center p-1.5 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm"
                                  title="Xem chi tiết"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                {dossier.status !== 'TRA_KET_QUA' && dossier.status !== 'TRA_HO_SO_MOT_CUA' && (
                                  <button 
                                    onClick={() => setSelectedDossier(dossier)}
                                    className="inline-flex items-center justify-center px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-all shadow-sm"
                                  >
                                    Xử lý
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
                      <div className="text-sm text-slate-500">
                        Hiển thị <span className="font-medium text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> đến <span className="font-medium text-slate-900">{Math.min(currentPage * itemsPerPage, filteredDossiers.length)}</span> trong số <span className="font-medium text-slate-900">{filteredDossiers.length}</span> kết quả
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                          className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Trước
                        </button>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={cn(
                                "w-8 h-8 flex items-center justify-center text-sm font-medium rounded-lg transition-colors",
                                currentPage === page
                                  ? "bg-indigo-600 text-white"
                                  : "text-slate-600 hover:bg-slate-100"
                              )}
                            >
                              {page}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                          className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Sau
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Combined Modal for Details and Processing */}
      {selectedDossier && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setSelectedDossier(null)}
          />
          
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white rounded-t-2xl">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    {selectedDossier.status === 'TRA_KET_QUA' || selectedDossier.status === 'TRA_HO_SO_MOT_CUA' ? 'Chi tiết hồ sơ' : 'Xử lý hồ sơ'}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium">{selectedDossier.id}</p>
                </div>
                <button 
                  onClick={() => setSelectedDossier(null)} 
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
                {/* Left Column: Info & Actions */}
                <div className="w-full md:w-1/2 p-6 overflow-y-auto border-b md:border-b-0 md:border-r border-slate-100 space-y-8">
                  {/* Info Card */}
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-200 flex items-center justify-center text-indigo-600">
                        <User className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-900">{selectedDossier.applicantName}</h4>
                        <Badge variant={selectedDossier.type === 'KHONG_THUE' ? 'info' : selectedDossier.type === 'CO_THUE' ? 'purple' : 'default'}>
                          {selectedDossier.type === 'KHONG_THUE' ? 'Không thuế' : selectedDossier.type === 'CO_THUE' ? 'Có thuế' : 'Chưa phân loại'}
                        </Badge>
                      </div>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Địa chỉ:</span>
                        <span className="font-medium text-slate-900 text-right max-w-[200px] truncate" title={selectedDossier.address}>{selectedDossier.address}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ngày nộp:</span>
                        <span className="font-medium text-slate-900">{format(new Date(selectedDossier.submissionDate), 'dd/MM/yyyy')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Nơi nhận:</span>
                        <span className="font-medium text-slate-900">{selectedDossier.noiNhan || 'Chưa cập nhật'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Trạng thái:</span>
                        <span className="font-medium text-amber-600">{STATUS_LABELS[selectedDossier.status].replace(/\n/g, ' ')}</span>
                      </div>
                      
                      <div className="pt-3 border-t border-slate-200 mt-3">
                        <h5 className="font-semibold text-slate-800 mb-2">Thông tin Chủ sử dụng</h5>
                        {selectedDossier.csd1 && (
                          <div className="flex justify-between mt-1">
                            <span className="text-slate-500">CSD 1:</span>
                            <span className="font-medium text-slate-900 text-right">{selectedDossier.csd1} {selectedDossier.cccd1 ? <span className="block text-xs text-slate-500">CCCD: {selectedDossier.cccd1}</span> : ''}</span>
                          </div>
                        )}
                        {selectedDossier.csd2 && (
                          <div className="flex justify-between mt-1">
                            <span className="text-slate-500">CSD 2:</span>
                            <span className="font-medium text-slate-900 text-right">{selectedDossier.csd2} {selectedDossier.cccd2 ? <span className="block text-xs text-slate-500">CCCD: {selectedDossier.cccd2}</span> : ''}</span>
                          </div>
                        )}
                        {selectedDossier.csd3 && (
                          <div className="flex justify-between mt-1">
                            <span className="text-slate-500">CSD 3:</span>
                            <span className="font-medium text-slate-900 text-right">{selectedDossier.csd3} {selectedDossier.cccd3 ? <span className="block text-xs text-slate-500">CCCD: {selectedDossier.cccd3}</span> : ''}</span>
                          </div>
                        )}
                        {selectedDossier.csd4 && (
                          <div className="flex justify-between mt-1">
                            <span className="text-slate-500">CSD 4:</span>
                            <span className="font-medium text-slate-900 text-right">{selectedDossier.csd4} {selectedDossier.cccd4 ? <span className="block text-xs text-slate-500">CCCD: {selectedDossier.cccd4}</span> : ''}</span>
                          </div>
                        )}
                      </div>

                      <div className="pt-3 border-t border-slate-200 mt-3">
                        <h5 className="font-semibold text-slate-800 mb-2">Thông tin Thửa đất</h5>
                        {selectedDossier.dctd && (
                          <div className="flex justify-between mt-1">
                            <span className="text-slate-500">Địa chỉ TĐ:</span>
                            <span className="font-medium text-slate-900 text-right max-w-[200px] truncate" title={selectedDossier.dctd}>{selectedDossier.dctd}</span>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                          {selectedDossier.ont && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">ONT:</span>
                              <span className="font-medium text-slate-900">{selectedDossier.ont}</span>
                            </div>
                          )}
                          {selectedDossier.cln && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">CLN:</span>
                              <span className="font-medium text-slate-900">{selectedDossier.cln}</span>
                            </div>
                          )}
                          {selectedDossier.luc && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">LUC:</span>
                              <span className="font-medium text-slate-900">{selectedDossier.luc}</span>
                            </div>
                          )}
                          {selectedDossier.bhk && (
                            <div className="flex justify-between">
                              <span className="text-slate-500">BHK:</span>
                              <span className="font-medium text-slate-900">{selectedDossier.bhk}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Area */}
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-indigo-500" />
                      Thao tác nghiệp vụ
                    </h4>
                    
                    {selectedDossier.status === 'PHAN_LOAI' ? (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-600 mb-4">Xác định loại hồ sơ để định tuyến quy trình:</p>
                        <button 
                          onClick={() => handleStatusChange(selectedDossier.id, 'IN_SO', 'KHONG_THUE')}
                          className="w-full flex items-center justify-between p-4 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl transition-all group shadow-sm"
                        >
                          <div className="text-left">
                            <span className="block font-semibold text-blue-700">KHÔNG THUẾ</span>
                            <span className="block text-xs text-slate-500 mt-1">Cấp đổi, cấp lại, gia hạn GCN</span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500 transition-colors" />
                        </button>
                        <button 
                          onClick={() => handleStatusChange(selectedDossier.id, 'LAP_PHIEU_CHUYEN_THUE', 'CO_THUE')}
                          className="w-full flex items-center justify-between p-4 bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-xl transition-all group shadow-sm"
                        >
                          <div className="text-left">
                            <span className="block font-semibold text-purple-700">CÓ THUẾ</span>
                            <span className="block text-xs text-slate-500 mt-1">Chuyển nhượng, cấp mới, thừa kế</span>
                          </div>
                          <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-purple-500 transition-colors" />
                        </button>
                      </div>
                    ) : WORKFLOW_TRANSITIONS[selectedDossier.status]?.next.length > 0 ? (
                      <div className="space-y-6">
                        <div className="space-y-3">
                          {WORKFLOW_TRANSITIONS[selectedDossier.status].next.map(nextStatus => (
                            <button
                              key={nextStatus}
                              onClick={() => handleStatusChange(selectedDossier.id, nextStatus)}
                              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
                            >
                              Chuyển: {STATUS_LABELS[nextStatus].replace(/\n/g, ' ')}
                              <ArrowRight className="w-4 h-4" />
                            </button>
                          ))}
                          
                          {(selectedDossier.status === 'TIEP_NHAN_HCC' || selectedDossier.status === 'TIEP_NHAN_CHI_NHANH') && (
                            <button
                              onClick={() => printControlSlip(selectedDossier)}
                              className="w-full flex items-center justify-center gap-2 px-5 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl font-medium transition-all shadow-sm hover:shadow-md active:scale-[0.98]"
                            >
                              <Printer className="w-4 h-4 text-slate-500" />
                              In Phiếu kiểm soát
                            </button>
                          )}
                        </div>

                        {/* Reject Option */}
                        {WORKFLOW_TRANSITIONS[selectedDossier.status].reject && (
                          <div className="pt-6 border-t border-slate-100">
                            <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl">
                              <h5 className="font-semibold text-rose-700 mb-3 flex items-center gap-2 text-sm">
                                <AlertTriangle className="w-4 h-4" />
                                Phát hiện sai sót / Trả hồ sơ
                              </h5>
                              <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Ghi rõ lý do từ chối để bộ phận Một cửa xử lý..."
                                className="w-full p-3 rounded-lg border border-rose-200 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 mb-3 text-sm bg-white resize-none"
                                rows={3}
                              />
                              <button
                                disabled={!rejectReason.trim()}
                                onClick={() => handleReject(selectedDossier.id, rejectReason)}
                                className="w-full px-4 py-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 disabled:opacity-50 disabled:hover:bg-white rounded-lg font-medium text-sm transition-colors shadow-sm"
                              >
                                Xác nhận trả hồ sơ
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-6 bg-slate-50 border border-slate-200 rounded-xl text-center flex flex-col items-center justify-center">
                        {selectedDossier.status === 'TRA_KET_QUA' ? (
                          <>
                            <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-3" />
                            <p className="font-medium text-slate-900">Hồ sơ đã hoàn thành</p>
                            <p className="text-sm text-slate-500 mt-1">Đã sẵn sàng trả kết quả cho công dân.</p>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-10 h-10 text-rose-500 mb-3" />
                            <p className="font-medium text-slate-900">Hồ sơ đã bị trả lại</p>
                            <p className="text-sm text-slate-500 mt-1">Đang chờ bộ phận Một cửa xử lý.</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Column: History */}
                <div className="w-full md:w-1/2 p-6 overflow-y-auto bg-slate-50/50">
                  <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-6 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Tiến độ thực hiện
                  </h4>
                  
                  {selectedDossier.history && selectedDossier.history.length > 0 ? (
                    <div className="relative border-l-2 border-slate-200 ml-3 space-y-8">
                      {selectedDossier.history.map((entry, idx) => (
                        <div key={idx} className="relative pl-6">
                          <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-2 border-indigo-500" />
                          <div className="mb-1 flex flex-col gap-1">
                            <span className="text-sm font-medium text-slate-900">{entry.action}</span>
                            <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full w-fit">
                              {format(new Date(entry.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                            </span>
                          </div>
                          {entry.note && (
                            <p className="text-sm text-slate-600 mt-1">{entry.note}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-slate-500">
                      <Clock className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                      <p>Chưa có lịch sử xử lý cho hồ sơ này.</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl flex justify-end">
                <button 
                  onClick={() => setSelectedDossier(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-sm"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TodayReceivingList({ dossiers, user }: { dossiers: Dossier[], user: any }) {
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const filteredDossiers = dossiers.filter(d => {
    // Check if it was submitted on the selected date
    const isSelectedDate = d.submissionDate === selectedDate;
    if (!isSelectedDate) return false;

    // Filter by location if user is onedoor
    if (user.role === 'onedoor') {
      return d.noiNhan === user.location;
    }
    
    // Admin sees all
    return true;
  });

  const totalPages = Math.ceil(filteredDossiers.length / itemsPerPage);
  const paginatedDossiers = filteredDossiers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset page when date changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [selectedDate]);

  const handleExport = () => {
    if (filteredDossiers.length === 0) {
      alert('Không có dữ liệu để xuất!');
      return;
    }

    const headers = ['Mã Hồ sơ', 'Người nộp', 'Địa chỉ', 'Nơi nhận', 'Trạng thái'];
    const csvContent = [
      headers.join(','),
      ...filteredDossiers.map(d => [
        `"${d.id}"`,
        `"${d.applicantName}"`,
        `"${d.address}"`,
        `"${d.noiNhan || ''}"`,
        `"${STATUS_LABELS[d.status].replace(/\n/g, ' ')}"`
      ].join(','))
    ].join('\n');

    // Add BOM for UTF-8 Excel support
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `danh-sach-tiep-nhan-${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Danh sách tiếp nhận</h3>
          <p className="text-sm text-slate-500 mt-1">
            {user.role === 'admin' ? 'Tất cả địa bàn' : `Địa bàn: ${user.location || 'Chưa xác định'}`}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
          />
          <button
            onClick={handleExport}
            disabled={filteredDossiers.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            <Download className="w-4 h-4" />
            Xuất danh sách
          </button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
              <th className="px-6 py-4 font-medium">Mã Hồ sơ</th>
              <th className="px-6 py-4 font-medium">Người nộp</th>
              <th className="px-6 py-4 font-medium">Địa chỉ</th>
              <th className="px-6 py-4 font-medium">Nơi nhận</th>
              <th className="px-6 py-4 font-medium">Trạng thái</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedDossiers.length > 0 ? (
              paginatedDossiers.map(dossier => (
                <tr key={dossier.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-900">{dossier.id}</td>
                  <td className="px-6 py-4 text-slate-600">{dossier.applicantName}</td>
                  <td className="px-6 py-4 text-slate-600">{dossier.address}</td>
                  <td className="px-6 py-4 text-slate-600">{dossier.noiNhan || 'Chưa cập nhật'}</td>
                  <td className="px-6 py-4">
                    <Badge variant="info">{STATUS_LABELS[dossier.status].replace(/\n/g, ' ')}</Badge>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  Không có hồ sơ nào được tiếp nhận trong ngày {format(new Date(selectedDate), 'dd/MM/yyyy')}.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Hiển thị <span className="font-medium text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> đến <span className="font-medium text-slate-900">{Math.min(currentPage * itemsPerPage, filteredDossiers.length)}</span> trong số <span className="font-medium text-slate-900">{filteredDossiers.length}</span> kết quả
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Trước
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center text-sm font-medium rounded-lg transition-colors",
                    currentPage === page
                      ? "bg-indigo-600 text-white"
                      : "text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Sau
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReceivingForm({ onSubmit, user }: { onSubmit: (data: Partial<Dossier>, print: boolean) => void, user: any }) {
  const [ownerCount, setOwnerCount] = useState(1);
  const [shouldPrint, setShouldPrint] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    submissionDate: format(new Date(), 'yyyy-MM-dd'),
    noiNhan: user.role === 'onedoor' && user.location ? user.location : 'Tân Khai',
    csd1: '', cccd1: '',
    csd2: '', cccd2: '',
    csd3: '', cccd3: '',
    csd4: '', cccd4: '',
    dctd: '',
    ont: '', cln: '', luc: '', bhk: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const removeOwner = (indexToRemove: number) => {
    setFormData(prev => {
      const newData = { ...prev };
      for (let i = indexToRemove; i < ownerCount; i++) {
        newData[`csd${i}` as keyof typeof formData] = newData[`csd${i+1}` as keyof typeof formData];
        newData[`cccd${i}` as keyof typeof formData] = newData[`cccd${i+1}` as keyof typeof formData];
      }
      newData[`csd${ownerCount}` as keyof typeof formData] = '';
      newData[`cccd${ownerCount}` as keyof typeof formData] = '';
      return newData;
    });
    setOwnerCount(prev => prev - 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      applicantName: formData.csd1 || 'Chưa cập nhật',
      address: formData.dctd || 'Chưa cập nhật',
      status: 'TIEP_NHAN_HCC', // Default status for new dossiers
    }, shouldPrint);
    
    // Clear form
    setFormData({
      id: '',
      submissionDate: format(new Date(), 'yyyy-MM-dd'),
      noiNhan: user.role === 'onedoor' && user.location ? user.location : 'Tân Khai',
      csd1: '', cccd1: '',
      csd2: '', cccd2: '',
      csd3: '', cccd3: '',
      csd4: '', cccd4: '',
      dctd: '',
      ont: '', cln: '', luc: '', bhk: ''
    });
    setOwnerCount(1);
    setShouldPrint(false);
    alert('Tiếp nhận hồ sơ thành công!');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50">
        <h3 className="text-lg font-semibold text-slate-800">Nhập thông tin hồ sơ mới</h3>
        <p className="text-sm text-slate-500 mt-1">Điền đầy đủ các thông tin theo biểu mẫu tiếp nhận.</p>
      </div>
      
      <div className="p-6 space-y-8">
        {/* Group 1: Thông tin chung */}
        <section>
          <h4 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-4 flex items-center gap-2">
            <FileText className="w-4 h-4" /> Thông tin chung
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Số hồ sơ</label>
              <input required type="text" name="id" value={formData.id} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="VD: HS-12345" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Ngày nhận</label>
              <input required type="date" name="submissionDate" value={formData.submissionDate} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nơi nhận</label>
              <select 
                name="noiNhan" 
                value={formData.noiNhan} 
                onChange={handleChange} 
                disabled={user.role === 'onedoor'}
                className={cn(
                  "w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
                  user.role === 'onedoor' && "bg-slate-100 text-slate-500 cursor-not-allowed"
                )}
              >
                <option value="Tân Khai">Tân Khai</option>
                <option value="Tân Quan">Tân Quan</option>
                <option value="Tân Hưng">Tân Hưng</option>
                <option value="Minh Đức">Minh Đức</option>
              </select>
            </div>
          </div>
        </section>

        <hr className="border-slate-100" />

        {/* Group 2: Chủ sử dụng */}
        <section>
          <h4 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-4 flex items-center gap-2">
            <User className="w-4 h-4" /> Thông tin Chủ sử dụng
          </h4>
          <div className="space-y-4">
            {[1, 2, 3, 4].slice(0, ownerCount).map((num) => (
              <div key={num} className="relative p-4 border border-slate-100 rounded-xl bg-slate-50/50">
                {num > 1 && (
                  <button
                    type="button"
                    onClick={() => removeOwner(num)}
                    className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Xóa chủ sử dụng này"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      CSD {num} {num === 1 && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      required={num === 1}
                      type="text"
                      name={`csd${num}`}
                      value={formData[`csd${num}` as keyof typeof formData] as string}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      placeholder="Họ và tên"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      CCCD {num} {num === 1 && <span className="text-rose-500">*</span>}
                    </label>
                    <input
                      required={num === 1}
                      type="text"
                      name={`cccd${num}`}
                      value={formData[`cccd${num}` as keyof typeof formData] as string}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                      placeholder="Số CCCD"
                    />
                  </div>
                </div>
              </div>
            ))}
            
            {ownerCount < 4 && (
              <button
                type="button"
                onClick={() => setOwnerCount(prev => prev + 1)}
                className="mt-2 flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" /> Thêm chủ sử dụng
              </button>
            )}
          </div>
        </section>

        <hr className="border-slate-100" />

        {/* Group 3: Thông tin thửa đất */}
        <section>
          <h4 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-4 flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" /> Thông tin Thửa đất
          </h4>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Địa chỉ thửa đất (ĐCTĐ) <span className="text-rose-500">*</span></label>
              <input required type="text" name="dctd" value={formData.dctd} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="Nhập địa chỉ chi tiết" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ONT (m²)</label>
                <input type="number" step="0.1" name="ont" value={formData.ont} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="0.0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">CLN (m²)</label>
                <input type="number" step="0.1" name="cln" value={formData.cln} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="0.0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">LUC (m²)</label>
                <input type="number" step="0.1" name="luc" value={formData.luc} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="0.0" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">BHK (m²)</label>
                <input type="number" step="0.1" name="bhk" value={formData.bhk} onChange={handleChange} className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" placeholder="0.0" />
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
        <button type="button" onClick={() => {
          setFormData({
            id: '', submissionDate: format(new Date(), 'yyyy-MM-dd'), noiNhan: user.role === 'onedoor' && user.location ? user.location : 'Tân Khai',
            csd1: '', cccd1: '', csd2: '', cccd2: '', csd3: '', cccd3: '', csd4: '', cccd4: '',
            dctd: '', ont: '', cln: '', luc: '', bhk: ''
          });
          setOwnerCount(1);
        }} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
          Làm mới
        </button>
        <button type="submit" onClick={() => setShouldPrint(true)} className="px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 shadow-sm flex items-center gap-2">
          <Printer className="w-4 h-4" /> Lưu & In phiếu
        </button>
        <button type="submit" onClick={() => setShouldPrint(false)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 shadow-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" /> Lưu hồ sơ
        </button>
      </div>
    </form>
  );
}

function StatCard({ title, value, icon, trend, trendColor = "text-emerald-600", bgIcon = "bg-slate-50" }: { title: string, value: number, icon: React.ReactNode, trend?: string, trendColor?: string, bgIcon?: string }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
          <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
        </div>
        <div className={cn("p-3 rounded-xl", bgIcon)}>
          {icon}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1.5 text-sm">
          <span className={cn("font-medium", trendColor)}>{trend}</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}