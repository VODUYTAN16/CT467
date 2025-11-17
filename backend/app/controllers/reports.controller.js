import * as service from '../services/reports.service.js';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { generatePdfReport } from '../services/reports.service.js';

export async function getTopEquipment(req, res, next) {
  try {
    const { month } = req.query;
    const data = await service.getTopEquipment(month);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getRevenueByPackage(req, res, next) {
  try {
    const { month } = req.query;
    const data = await service.getRevenueByPackage(month);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function exportPdf(req, res) {
  try {
    const { month } = req.query;
    const pdfBuffer = await generatePdfReport(month);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
    res.send(pdfBuffer);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating PDF');
  }
}

export async function exportWord(req, res, next) {
  try {
    const { month } = req.query;

    // 🔥 Gọi service, KHÔNG gọi controller
    const topEquipment = await service.getTopEquipment(month);
    const revenueByPackage = await service.getRevenueByPackage(month);

    const children = [];
    const now = new Date();
    const formattedDate = now.toLocaleString('vi-VN', { hour12: false });

    // ===== Tiêu đề báo cáo =====
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'BÁO CÁO DOANH SỐ',
            bold: true,
            size: 40,
          }),
        ],
        alignment: 'center',
      })
    );

    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: `Thời gian xuất file: ${formattedDate}`,
            size: 22,
          }),
        ],
        alignment: 'center',
      })
    );

    if (month) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Kỳ báo cáo: Tháng ${month}`,
              italics: true,
              size: 22,
            }),
          ],
          alignment: 'center',
        })
      );
    }

    children.push(new Paragraph({ text: '' }));

    // ===== Thiết bị =====
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '1. Top Equipment Usage',
            bold: true,
            size: 28,
          }),
        ],
      })
    );

    if (topEquipment.length === 0) {
      children.push(new Paragraph('No data.'));
    } else {
      topEquipment.forEach((item) => {
        children.push(new Paragraph(`${item.name}: ${item.usage_count}`));
      });
    }

    children.push(new Paragraph({ text: '' }));

    // ===== Doanh thu theo gói =====
    children.push(
      new Paragraph({
        children: [
          new TextRun({
            text: '2. Revenue By Package',
            bold: true,
            size: 28,
          }),
        ],
      })
    );

    if (revenueByPackage.length === 0) {
      children.push(new Paragraph('No data.'));
    } else {
      revenueByPackage.forEach((item) => {
        const amount = Number(item.total_revenue || 0);
        const formatted = amount.toLocaleString('vi-VN');
        children.push(
          new Paragraph(`${item.package_name} (${item.ym}): ${formatted} VND`)
        );
      });

      const totalRevenue = revenueByPackage.reduce(
        (sum, item) => sum + Number(item.total_revenue || 0),
        0
      );

      children.push(new Paragraph({ text: '' }));
      children.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Tổng doanh thu tháng ${
                month || ''
              }: ${totalRevenue.toLocaleString('vi-VN')} VND`,
              bold: true,
            }),
          ],
        })
      );
    }

    // Tạo Word document
    const doc = new Document({ sections: [{ children }] });
    const buffer = await Packer.toBuffer(doc);

    // Gửi file Word về client
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="bao-cao-doanh-so-${month || 'all'}.docx"`
    );
    res.send(buffer);
  } catch (err) {
    next(err);
  }
}

export async function expiringSoon(req, res, next) {
  try {
    res.json(await service.membersExpiringSoon(req.query.days || 7));
  } catch (e) {
    next(e);
  }
}
