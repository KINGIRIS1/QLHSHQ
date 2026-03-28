import React from 'react';
import { Dossier } from '../types';
import { STATUS_LABELS } from '../constants';
import { format } from 'date-fns';
import { AlertTriangle, Eye } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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

export function RejectedDossiersList({ 
  dossiers, 
  user, 
  onSelectDossier,
  selectedDossierIds,
  setSelectedDossierIds,
  handleBatchStatusChange
}: { 
  dossiers: Dossier[], 
  user: any, 
  onSelectDossier: (d: Dossier) => void,
  selectedDossierIds: string[],
  setSelectedDossierIds: React.Dispatch<React.SetStateAction<string[]>>,
  handleBatchStatusChange: (status: any) => void
}) {
  const [currentPage, setCurrentPage] = React.useState(1);
  const itemsPerPage = 10;

  const rejectedDossiers = dossiers.filter(d => {
    if (d.status !== 'TRA_HO_SO_MOT_CUA') return false;
    if (user.role === 'onedoor') return d.noiNhan === user.location;
    return true;
  });

  const totalPages = Math.ceil(rejectedDossiers.length / itemsPerPage);
  const paginatedDossiers = rejectedDossiers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-5 border-b border-slate-100 bg-rose-50/30 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">Hồ sơ trả (Không đủ ĐK)</h3>
            <p className="text-sm text-slate-500 mt-1">
              {user.role === 'admin' ? 'Tất cả địa bàn' : `Địa bàn: ${user.location || 'Chưa xác định'}`}
            </p>
          </div>
        </div>
        <Badge variant="danger">{rejectedDossiers.length} hồ sơ</Badge>
      </div>
      <div className="overflow-x-auto">
        {/* Batch Actions */}
        {selectedDossierIds.length > 0 && (
          <div className="bg-rose-50 border-y border-rose-100 px-6 py-3 flex items-center justify-between animate-in fade-in slide-in-from-top-2">
            <span className="text-rose-700 font-medium">Đã chọn {selectedDossierIds.length} hồ sơ</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBatchStatusChange('TIEP_NHAN')}
                className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-sm font-medium hover:bg-rose-700 transition-colors shadow-sm"
              >
                Tiếp nhận lại
              </button>
              <button onClick={() => setSelectedDossierIds([])} className="px-3 py-1.5 text-slate-600 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors">Hủy</button>
            </div>
          </div>
        )}
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
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
                  className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
              </th>
              <th className="px-6 py-4 font-medium">Mã Hồ sơ</th>
              <th className="px-6 py-4 font-medium">Người nộp</th>
              <th className="px-6 py-4 font-medium">Địa chỉ</th>
              <th className="px-6 py-4 font-medium">Ngày nộp</th>
              <th className="px-6 py-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedDossiers.length > 0 ? (
              paginatedDossiers.map(dossier => (
                <tr key={dossier.id} className="hover:bg-slate-50/50 transition-colors">
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
                      className="rounded border-slate-300 text-rose-600 focus:ring-rose-500 cursor-pointer"
                    />
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">{dossier.id}</td>
                  <td className="px-6 py-4 text-slate-600">{dossier.applicantName}</td>
                  <td className="px-6 py-4 text-slate-600 max-w-[200px] truncate" title={dossier.address}>{dossier.address}</td>
                  <td className="px-6 py-4 text-slate-600">{format(new Date(dossier.submissionDate), 'dd/MM/yyyy')}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => onSelectDossier(dossier)}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Xem / Xử lý
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center">
                    <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                      <AlertTriangle className="w-6 h-6 text-slate-300" />
                    </div>
                    <p>Không có hồ sơ nào bị trả lại.</p>
                  </div>
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
            Hiển thị <span className="font-medium text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> đến <span className="font-medium text-slate-900">{Math.min(currentPage * itemsPerPage, rejectedDossiers.length)}</span> trong số <span className="font-medium text-slate-900">{rejectedDossiers.length}</span> kết quả
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
