import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';

interface AuthContextType {
  user: User | null;
  login: (username: string, passwordHash: string) => boolean;
  logout: () => void;
  users: User[];
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  changePassword: (id: string, newPasswordHash: string) => void;
}

const defaultUsers: User[] = [
  { id: '1', username: 'admin', passwordHash: 'admin123', fullName: 'Quản trị viên', role: 'admin', location: 'Tất cả' },
  { id: '2', username: 'onedoor', passwordHash: 'onedoor123', fullName: 'Bộ phận một cửa', role: 'onedoor', location: 'Tân Khai' },
  { id: '3', username: 'user', passwordHash: 'user123', fullName: 'Nhân viên xử lý', role: 'user', location: 'Tân Khai' },
];

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('app_users');
    return saved ? JSON.parse(saved) : defaultUsers;
  });

  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('app_current_user');
    return saved ? JSON.parse(saved) : null;
  });

  useEffect(() => {
    localStorage.setItem('app_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('app_current_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('app_current_user');
    }
  }, [user]);

  const login = (username: string, passwordHash: string) => {
    const foundUser = users.find(u => u.username === username && u.passwordHash === passwordHash);
    if (foundUser) {
      setUser(foundUser);
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
  };

  const addUser = (newUser: Omit<User, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    setUsers([...users, { ...newUser, id }]);
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(users.map(u => (u.id === id ? { ...u, ...updates } : u)));
    if (user?.id === id) {
      setUser({ ...user, ...updates });
    }
  };

  const deleteUser = (id: string) => {
    setUsers(users.filter(u => u.id !== id));
  };

  const changePassword = (id: string, newPasswordHash: string) => {
    setUsers(users.map(u => (u.id === id ? { ...u, passwordHash: newPasswordHash } : u)));
    if (user?.id === id) {
      setUser({ ...user, passwordHash: newPasswordHash });
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, users, addUser, updateUser, deleteUser, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
