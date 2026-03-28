import { Dossier } from './types';

export const mockDossiers: Dossier[] = [
  {
    id: 'HS-2023-001',
    applicantName: 'Nguyễn Văn A',
    address: '123 Đường Lê Lợi, Quận 1, TP.HCM',
    type: null,
    status: 'TIEP_NHAN_HCC',
    submissionDate: '2023-10-25T08:30:00Z',
    lastUpdated: '2023-10-25T08:30:00Z',
    history: [
      {
        status: 'TIEP_NHAN_HCC',
        timestamp: '2023-10-25T08:30:00Z',
        action: 'Tiếp nhận hồ sơ mới',
      }
    ]
  },
  {
    id: 'HS-2023-002',
    applicantName: 'Trần Thị B',
    address: '456 Đường Nguyễn Huệ, Quận 1, TP.HCM',
    type: 'KHONG_THUE',
    status: 'THAM_TRA',
    submissionDate: '2023-10-24T09:15:00Z',
    lastUpdated: '2023-10-26T10:00:00Z',
    history: [
      {
        status: 'TIEP_NHAN_HCC',
        timestamp: '2023-10-24T09:15:00Z',
        action: 'Tiếp nhận hồ sơ mới',
      },
      {
        status: 'TIEP_NHAN_CHI_NHANH',
        timestamp: '2023-10-24T14:00:00Z',
        action: 'Chuyển sang: Tiếp nhận tại Chi nhánh',
      },
      {
        status: 'PHAN_LOAI',
        timestamp: '2023-10-25T08:30:00Z',
        action: 'Chuyển sang: Phân loại hồ sơ',
      },
      {
        status: 'THAM_TRA',
        timestamp: '2023-10-26T10:00:00Z',
        action: 'Chuyển sang: Thẩm tra',
      }
    ]
  },
  {
    id: 'HS-2023-003',
    applicantName: 'Lê Văn C',
    address: '789 Đường Trần Hưng Đạo, Quận 5, TP.HCM',
    type: 'CO_THUE',
    status: 'LAP_PHIEU_CHUYEN_THUE',
    submissionDate: '2023-10-23T14:20:00Z',
    lastUpdated: '2023-10-25T11:30:00Z',
  },
  {
    id: 'HS-2023-004',
    applicantName: 'Phạm Thị D',
    address: '101 Đường Võ Văn Kiệt, Quận 6, TP.HCM',
    type: 'KHONG_THUE',
    status: 'TRA_HO_SO_MOT_CUA',
    submissionDate: '2023-10-20T10:00:00Z',
    lastUpdated: '2023-10-22T15:45:00Z',
    errorReason: 'Sai thông tin thửa đất trên phiếu thẩm tra.',
    errorDepartment: 'Bộ phận Thẩm tra',
  },
  {
    id: 'HS-2023-005',
    applicantName: 'Hoàng Văn E',
    address: '202 Đường Phạm Văn Đồng, TP. Thủ Đức',
    type: 'CO_THUE',
    status: 'CHO_NOP_TIEN',
    submissionDate: '2023-10-15T08:00:00Z',
    lastUpdated: '2023-10-26T09:00:00Z',
  },
];
