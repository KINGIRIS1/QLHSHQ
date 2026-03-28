import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Role } from '../types';
import { Plus, Edit2, Trash2, Shield, User as UserIcon, Key } from 'lucide-react';

import { LOCATIONS } from '../constants';

export default function UserManagement() {
  const { users, addUser, updateUser, deleteUser } = useAuth();
  const [isAdding, setIsAdding] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const handleSave = () => {
    if (editingUser) {
      updateUser(editingUser.id, formData);
    } else {
      addUser(formData as Omit<User, 'id'>);
    }
    setIsAdding(false);
    setEditingUser(null);
    setFormData({});
  };

  const roleLabels: Record<Role, string> = {
    admin: 'Quản trị viên',
    onedoor: 'Một cửa',
    user: 'Nhân viên xử lý',
  };

  const totalPages = Math.ceil(users.length / itemsPerPage);
  const paginatedUsers = users.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Quản lý người dùng</h2>
          <p className="text-slate-500 mt-1">Thêm, sửa, xóa tài khoản hệ thống</p>
        </div>
        <button
          onClick={() => {
            setIsAdding(true);
            setFormData({ role: 'user' });
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          Thêm người dùng
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
              <th className="px-6 py-4 font-medium">Tài khoản</th>
              <th className="px-6 py-4 font-medium">Họ tên</th>
              <th className="px-6 py-4 font-medium">Địa bàn</th>
              <th className="px-6 py-4 font-medium">Vai trò</th>
              <th className="px-6 py-4 font-medium text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {paginatedUsers.map(user => (
              <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <UserIcon className="w-5 h-5" />
                    </div>
                    <span className="font-medium text-slate-900">{user.username}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-slate-600">{user.fullName}</td>
                <td className="px-6 py-4 text-slate-600">{user.location || 'Tất cả'}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium ${
                    user.role === 'admin' ? 'bg-rose-50 text-rose-700' :
                    user.role === 'onedoor' ? 'bg-amber-50 text-amber-700' :
                    'bg-emerald-50 text-emerald-700'
                  }`}>
                    <Shield className="w-4 h-4" />
                    {roleLabels[user.role]}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setFormData(user);
                      }}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Sửa"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteUser(user.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                      title="Xóa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Hiển thị <span className="font-medium text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> đến <span className="font-medium text-slate-900">{Math.min(currentPage * itemsPerPage, users.length)}</span> trong số <span className="font-medium text-slate-900">{users.length}</span> kết quả
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
                    className={`w-8 h-8 flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${
                      currentPage === page
                        ? "bg-indigo-600 text-white"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
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

      {(isAdding || editingUser) && (
        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingUser ? 'Sửa người dùng' : 'Thêm người dùng mới'}
              </h3>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tên đăng nhập</label>
                <input
                  type="text"
                  value={formData.username || ''}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Họ tên</label>
                <input
                  type="text"
                  value={formData.fullName || ''}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
                <input
                  type="password"
                  value={formData.passwordHash || ''}
                  onChange={e => setFormData({ ...formData, passwordHash: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600"
                  placeholder={editingUser ? "Để trống nếu không đổi" : ""}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vai trò</label>
                <select
                  value={formData.role || 'user'}
                  onChange={e => setFormData({ ...formData, role: e.target.value as Role })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 bg-white"
                >
                  <option value="admin">Quản trị viên</option>
                  <option value="onedoor">Một cửa</option>
                  <option value="user">Nhân viên xử lý</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Địa bàn</label>
                <select
                  value={formData.location || 'Tất cả'}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-600 focus:border-indigo-600 bg-white"
                >
                  <option value="Tất cả">Tất cả</option>
                  {LOCATIONS.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingUser(null);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
