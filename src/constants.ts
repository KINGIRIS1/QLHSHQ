import { DossierStatus } from './types';

export const STATUS_LABELS: Record<DossierStatus, string> = {
  TIEP_NHAN_HCC: 'Tiếp nhận\nHCC',
  TIEP_NHAN_CHI_NHANH: 'Tiếp nhận\nChi nhánh',
  NHAP_DNLIS: 'Nhập\nDNLis',
  PHAN_LOAI: 'Phân loại',
  IN_SO: 'In sổ',
  LAP_PHIEU_THAM_TRA: 'Lập phiếu\nthẩm tra',
  THAM_TRA: 'Thẩm tra',
  IN_GCN: 'In GCN',
  TRINH_KY: 'Trình ký',
  DONG_DAU: 'Đóng dấu',
  LAP_PHIEU_CHUYEN_THUE: 'Lập PC thuế',
  CHUYEN_THUE: 'Chuyển CQ thuế',
  CHO_THONG_BAO_THUE: 'Nhận TB thuế',
  CHO_NOP_TIEN: 'Người dân\nnộp tiền',
  XAC_NHAN_HOAN_THANH_THUE: 'Xác nhận\nhoàn thành thuế',
  IN_SO_THUE: 'In sổ',
  THAM_TRA_THUE: 'Thẩm tra',
  IN_THUE: 'In',
  KY_THUE: 'Ký',
  TRA_KET_QUA: 'Trả kết quả',
  TRA_HO_SO_MOT_CUA: 'Hồ sơ trả\n(Không đủ ĐK)',
};

export const LOCATIONS = [
  'Tân Khai',
  'Tân Quan',
  'Tân Hưng',
  'Minh Đức',
];

export const WORKFLOW_TRANSITIONS: Record<DossierStatus, { next: DossierStatus[], reject?: DossierStatus }> = {
  TIEP_NHAN_HCC: { next: ['TIEP_NHAN_CHI_NHANH'] },
  TIEP_NHAN_CHI_NHANH: { next: ['NHAP_DNLIS'] },
  NHAP_DNLIS: { next: ['PHAN_LOAI'] },
  PHAN_LOAI: { next: ['IN_SO', 'LAP_PHIEU_CHUYEN_THUE'] }, // Requires type selection
  
  // Không Thuế
  IN_SO: { next: ['LAP_PHIEU_THAM_TRA'] },
  LAP_PHIEU_THAM_TRA: { next: ['THAM_TRA'] },
  THAM_TRA: { next: ['IN_GCN'], reject: 'TRA_HO_SO_MOT_CUA' },
  IN_GCN: { next: ['TRINH_KY'] },
  TRINH_KY: { next: ['DONG_DAU'] },
  DONG_DAU: { next: ['TRA_KET_QUA'] },
  
  // Có Thuế
  LAP_PHIEU_CHUYEN_THUE: { next: ['CHUYEN_THUE'], reject: 'TRA_HO_SO_MOT_CUA' },
  CHUYEN_THUE: { next: ['CHO_THONG_BAO_THUE'] },
  CHO_THONG_BAO_THUE: { next: ['CHO_NOP_TIEN'] },
  CHO_NOP_TIEN: { next: ['XAC_NHAN_HOAN_THANH_THUE'] },
  XAC_NHAN_HOAN_THANH_THUE: { next: ['IN_SO_THUE'] },
  IN_SO_THUE: { next: ['THAM_TRA_THUE'] },
  THAM_TRA_THUE: { next: ['IN_THUE'] },
  IN_THUE: { next: ['KY_THUE'] },
  KY_THUE: { next: ['TRA_KET_QUA'] },
  
  // End states
  TRA_KET_QUA: { next: [] },
  TRA_HO_SO_MOT_CUA: { next: [] },
};
