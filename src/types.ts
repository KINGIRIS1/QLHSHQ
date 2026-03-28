export type Role = 'admin' | 'onedoor' | 'user';

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  fullName: string;
  role: Role;
  location?: string;
}

export type DossierType = 'KHONG_THUE' | 'CO_THUE';

export type DossierStatus =
  | 'TIEP_NHAN_HCC'
  | 'TIEP_NHAN_CHI_NHANH'
  | 'NHAP_DNLIS'
  | 'PHAN_LOAI'
  // Nhánh Không Thuế
  | 'IN_SO'
  | 'LAP_PHIEU_THAM_TRA'
  | 'THAM_TRA'
  | 'IN_GCN'
  | 'TRINH_KY'
  | 'DONG_DAU'
  // Nhánh Có Thuế
  | 'LAP_PHIEU_CHUYEN_THUE'
  | 'CHUYEN_THUE'
  | 'CHO_THONG_BAO_THUE'
  | 'CHO_NOP_TIEN'
  | 'XAC_NHAN_HOAN_THANH_THUE'
  | 'IN_SO_THUE'
  | 'THAM_TRA_THUE'
  | 'IN_THUE'
  | 'KY_THUE'
  // Chung
  | 'TRA_KET_QUA'
  | 'TRA_HO_SO_MOT_CUA';

export interface DossierHistory {
  status: DossierStatus;
  timestamp: string;
  action: string;
  note?: string;
}

export interface Dossier {
  id: string;
  applicantName: string;
  address: string;
  type: DossierType | null;
  status: DossierStatus;
  submissionDate: string;
  lastUpdated: string;
  history?: DossierHistory[];
  notes?: string;
  errorReason?: string;
  errorDepartment?: string;
  
  // New fields for Receiving Tab
  csd1?: string;
  cccd1?: string;
  csd2?: string;
  cccd2?: string;
  csd3?: string;
  cccd3?: string;
  csd4?: string;
  cccd4?: string;
  dctd?: string;
  ont?: string;
  cln?: string;
  luc?: string;
  bhk?: string;
  noiNhan?: string;
}
