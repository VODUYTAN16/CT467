import { pool } from '../config/db.js';
import PDFDocument from 'pdfkit';
import {
  Document,
  Paragraph,
  Packer,
  Table,
  TableRow,
  TableCell,
  WidthType,
} from 'docx';
import path from 'path';
import { fileURLToPath } from 'url';

import { isSubscriptionExpiringSoon } from './members.service.js';
import { findAllSubscriptions } from './subscriptions.service.js';

// Lấy __dirname cho ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//
// Helper: filter by YYYY-MM
//
function monthFilter(column, month) {
  return month ? `WHERE DATE_FORMAT(${column}, '%Y-%m') = :month` : '';
}

//
// 1. Top Equipment Usage
//
export async function getTopEquipment(month = null) {
  const params = {};
  const where = monthFilter('eu.use_date', month);

  if (month) params.month = month;

  const [rows] = await pool.query(
    `
    SELECT 
        eu.equipment_id,
        e.name,
        COUNT(*) AS usage_count
    FROM equipment_usage eu
    JOIN equipment e ON eu.equipment_id = e.equipment_id
    ${where}
    GROUP BY eu.equipment_id, e.name
    ORDER BY usage_count DESC
    `,
    params
  );

  return rows;
}

//
// 2. Revenue by package monthly
//
export async function getRevenueByPackage(month = null) {
  const params = {};
  const where = monthFilter('pay.paid_at', month);

  if (month) params.month = month;

  const [rows] = await pool.query(
    `
    SELECT 
        p.name AS package_name,
        DATE_FORMAT(pay.paid_at, '%Y-%m') AS ym,
        SUM(pay.amount) AS total_revenue
    FROM payments pay
    JOIN subscriptions s ON s.subscription_id = pay.subscription_id
    JOIN packages p ON p.package_id = s.package_id
    ${where}
    GROUP BY p.name, ym
    ORDER BY total_revenue DESC
    `,
    params
  );

  return rows;
}

//
// 3. Tổng doanh thu tháng
//
export async function getTotalRevenue(month = null) {
  const params = {};
  const where = monthFilter('paid_at', month);

  if (month) params.month = month;

  const [rows] = await pool.query(
    `
      SELECT SUM(amount) AS total
      FROM payments
      ${where}
    `,
    params
  );

  return rows[0].total || 0;
}

//
// DRAW TABLE PDF
//
function drawTable(doc, headers, data, keys, widths) {
  const cellPadding = 6;
  const rowHeight = 25;
  let y = doc.y + 10;
  let x = 50;

  // Header row
  doc.fontSize(12).font('Roboto-Regular');
  headers.forEach((h, i) => {
    doc.rect(x, y, widths[i], rowHeight).stroke();
    doc.text(h, x + cellPadding, y + 7, { width: widths[i] - 10 });
    x += widths[i];
  });

  y += rowHeight;

  // Data rows
  data.forEach((row) => {
    x = 50;

    // Auto new page
    if (y + rowHeight > doc.page.height - 50) {
      doc.addPage();
      y = 50;
    }

    keys.forEach((key, i) => {
      let text = row[key];

      // Format number
      if (key === 'total_revenue') {
        text = new Intl.NumberFormat('vi-VN').format(text);
      }

      doc.rect(x, y, widths[i], rowHeight).stroke();
      doc.text(String(text ?? ''), x + cellPadding, y + 7, {
        width: widths[i] - 10,
      });
      x += widths[i];
    });

    y += rowHeight;
  });

  doc.moveDown();
}

//
// 4. Generate PDF
//
export async function generatePdfReport(month = null) {
  const doc = new PDFDocument({ margin: 50 });
  const buffers = [];
  doc.on('data', buffers.push.bind(buffers));

  // Load Unicode font
  try {
    const fontPath = path.join(__dirname, '..', 'fonts', 'Roboto-Regular.ttf');
    doc.registerFont('Roboto-Regular', fontPath);
    doc.font('Roboto-Regular');
  } catch (err) {
    console.error('Font load error:', err);
    doc.font('Helvetica');
  }

  // HEADER
  doc.fontSize(22).text('Báo cáo Quản lý Phòng Gym', { align: 'center' });
  if (month) doc.text(`Tháng: ${month}`, { align: 'center' });
  doc.moveDown(2);

  // ======================
  // 1. THIẾT BỊ DÙNG NHIỀU
  // ======================
  const topEquipment = await getTopEquipment(month);

  doc.fontSize(16).text('1. Thiết bị được sử dụng nhiều nhất');
  drawTable(
    doc,
    ['Thiết bị', 'Số lượt'],
    topEquipment,
    ['name', 'usage_count'],
    [300, 100]
  );

  // ======================
  // 2. DOANH THU THEO GÓI
  // ======================
  const revenue = await getRevenueByPackage(month);

  doc.addPage();
  doc.fontSize(16).text('2. Doanh thu theo gói');
  drawTable(
    doc,
    ['Gói', 'Tháng', 'Doanh thu'],
    revenue,
    ['package_name', 'ym', 'total_revenue'],
    [200, 100, 150]
  );

  // ======================
  // 3. TỔNG DOANH THU THÁNG
  // ======================
  const total = await getTotalRevenue(month);

  doc.moveDown(2);
  doc.fontSize(18).text('3. Tổng doanh thu tháng:', { underline: true });
  doc.fontSize(20).text(
    new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(total),
    { align: 'center' }
  );

  doc.end();

  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(buffers)));
  });
}

//
// 5. Export Word
//
export async function exportWord(month = null) {
  const [topEquipment, revenue, total] = await Promise.all([
    getTopEquipment(month),
    getRevenueByPackage(month),
    getTotalRevenue(month),
  ]);

  // WORD TABLE helper
  function makeTable(headers, rows, keys) {
    return new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: headers.map(
            (h) =>
              new TableCell({
                children: [new Paragraph(h)],
              })
          ),
        }),
        ...rows.map(
          (r) =>
            new TableRow({
              children: keys.map(
                (k) =>
                  new TableCell({
                    children: [new Paragraph(String(r[k] ?? ''))],
                  })
              ),
            })
        ),
      ],
    });
  }

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: 'BÁO CÁO QUẢN LÝ PHÒNG GYM',
            heading: 'Heading1',
          }),
          month ? new Paragraph(`Tháng: ${month}`) : new Paragraph(''),

          new Paragraph(''),

          new Paragraph('1. Thiết bị sử dụng nhiều nhất'),
          makeTable(['Tên thiết bị', 'Số lượt'], topEquipment, [
            'name',
            'usage_count',
          ]),

          new Paragraph(''),

          new Paragraph('2. Doanh thu theo gói'),
          makeTable(['Gói', 'Tháng', 'Doanh thu'], revenue, [
            'package_name',
            'ym',
            'total_revenue',
          ]),

          new Paragraph(''),

          new Paragraph('Tổng doanh thu tháng'),
          new Paragraph(
            new Intl.NumberFormat('vi-VN', {
              style: 'currency',
              currency: 'VND',
            }).format(total)
          ),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

export async function membersExpiringSoon(days = 7) {
  const allSubscriptions = await findAllSubscriptions();
  const expiringSubscriptions = allSubscriptions.filter(
    (sub) => sub.end_date && isSubscriptionExpiringSoon(sub.end_date, days)
  );

  return expiringSubscriptions.map((sub) => ({
    member_id: sub.member_id,
    full_name: sub.member?.full_name || '',
    phone: sub.member?.phone || '',
    subscription_id: sub.subscription_id,
    package_name: sub.package?.name || '',
    end_date: sub.end_date,
  }));
}
