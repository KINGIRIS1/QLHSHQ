import { format } from 'date-fns';
import { Dossier } from '../types';

export const printControlSlip = (dossier: Dossier) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Vui lòng cho phép popup để in phiếu.');
    return;
  }

  const now = new Date();
  const formattedDate = `${now.getHours()} giờ ${now.getMinutes()} phút, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;

  const emptyRows = Array(11).fill(0).map(() => `
    <tr class="avoid-break">
      <td style="width: 12%; border: 1px solid black;"></td>
      <td style="width: 58%; border: 1px solid black; padding: 0;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td colspan="3" style="border-bottom: 1px solid black; padding: 6px; text-align: left; white-space: nowrap;">
              1.Giao &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ..... giờ ..... phút, ngày..... tháng ..... năm......
            </td>
          </tr>
          <tr>
            <td style="width: 15%; border-right: 1px solid black; padding: 6px; text-align: left; vertical-align: top;">2.Nhận</td>
            <td style="width: 42.5%; border-right: 1px solid black; padding: 6px; text-align: center; vertical-align: top;">Người giao<br><br><br><br></td>
            <td style="width: 42.5%; padding: 6px; text-align: center; vertical-align: top;">Người nhận<br><br><br><br></td>
          </tr>
        </table>
      </td>
      <td style="width: 15%; border: 1px solid black;"></td>
      <td style="width: 15%; border: 1px solid black;"></td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Phiếu kiểm soát quá trình giải quyết hồ sơ</title>
      <style>
        body {
          font-family: "Times New Roman", Times, serif;
          font-size: 12pt;
          line-height: 1.3;
          margin: 0;
          padding: 0;
        }
        .page {
          width: 210mm;
          min-height: 297mm;
          padding: 15mm 20mm;
          margin: 0 auto;
          box-sizing: border-box;
        }
        .header {
          display: flex;
          justify-content: space-between;
          text-align: center;
          margin-bottom: 15px;
        }
        .header-left {
          width: 45%;
          font-weight: bold;
        }
        .header-right {
          width: 50%;
          font-weight: bold;
        }
        .header-line {
          white-space: nowrap;
        }
        .title {
          text-align: center;
          font-weight: bold;
          font-size: 13pt;
          margin-top: 20px;
          margin-bottom: 5px;
        }
        .subtitle {
          text-align: center;
          font-weight: bold;
          margin-bottom: 15px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th {
          border: 1px solid black;
          padding: 6px;
          text-align: center;
          vertical-align: middle;
          font-weight: bold;
        }
        .avoid-break {
          page-break-inside: avoid;
        }
        @media print {
          body { margin: 0; padding: 0; background: white; }
          .page { margin: 0; padding: 0; width: 100%; height: 100%; }
          @page { size: A4; margin: 15mm 20mm; }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="page">
        <div class="header">
          <div class="header-left">
            <div class="header-line">VĂN PHÒNG ĐKĐĐ TỈNH ĐỒNG NAI</div>
            <div class="header-line">CHI NHÁNH HỚN QUẢN</div>
          </div>
          <div class="header-right">
            <div class="header-line">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</div>
            <div class="header-line">Độc lập - Tự do - Hạnh phúc</div>
          </div>
        </div>
        
        <div class="title">PHIẾU KIỂM SOÁT QUÁ TRÌNH GIẢI QUYẾT HỒ SƠ</div>
        <div class="subtitle">Mã hồ sơ: ${dossier.id}</div>
        
        <table>
          <thead>
            <tr>
              <th style="width: 12%;">TÊN CƠ<br/>QUAN</th>
              <th style="width: 58%;">THỜI GIAN GIAO, NHẬN HỒ SƠ</th>
              <th style="width: 15%;">KẾT QUẢ</th>
              <th style="width: 15%;">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            <tr class="avoid-break">
              <td style="width: 12%; border: 1px solid black;"></td>
              <td style="width: 58%; border: 1px solid black; padding: 0;">
                <table style="width: 100%; border-collapse: collapse;">
                  <tr>
                    <td colspan="3" style="border-bottom: 1px solid black; padding: 6px; text-align: left; white-space: nowrap;">
                      1.Giao &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${formattedDate}
                    </td>
                  </tr>
                  <tr>
                    <td style="width: 15%; border-right: 1px solid black; padding: 6px; text-align: left; vertical-align: top;">2.Nhận</td>
                    <td style="width: 42.5%; border-right: 1px solid black; padding: 6px; text-align: center; vertical-align: top;">Người giao<br><br><br><br></td>
                    <td style="width: 42.5%; padding: 6px; text-align: center; vertical-align: top;">Người nhận<br><br><br><br></td>
                  </tr>
                </table>
              </td>
              <td style="width: 15%; border: 1px solid black;"></td>
              <td style="width: 15%; border: 1px solid black;"></td>
            </tr>
            ${emptyRows}
          </tbody>
        </table>
      </div>
      <script>
        window.onload = () => {
          window.print();
          setTimeout(() => window.close(), 500);
        };
      </script>
    </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
};
