import { pool } from "../config/db.js";
import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType } from "docx";
import { isSubscriptionExpiringSoon } from "./members.service.js";
import { findAllSubscriptions } from "./subscriptions.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function topEquipmentUsage(limit = 10) {
  const [rows] = await pool.query(
    `SELECT eu.equipment_id, e.name, COUNT(*) AS usage_count
     FROM equipment_usage eu
     JOIN equipment e ON e.equipment_id = eu.equipment_id
     GROUP BY eu.equipment_id, e.name
     ORDER BY usage_count DESC
     LIMIT :lim`,
    { lim: Number(limit) }
  );
  return rows;
}

export async function revenueByPackageMonthly() {
  const [rows] = await pool.query(
    `SELECT p.name AS package_name,
            DATE_FORMAT(pay.paid_at, '%Y-%m') AS ym,
            SUM(pay.amount) AS total_revenue
     FROM payments pay
     JOIN subscriptions s ON s.subscription_id = pay.subscription_id
     JOIN packages p ON p.package_id = s.package_id
     GROUP BY p.name, ym
     ORDER BY ym DESC, total_revenue DESC`
  );
  return rows;
}

export async function membersExpiringSoon(days = 7) {
  const allSubscriptions = await findAllSubscriptions();
  const expiringSubscriptions = allSubscriptions.filter(sub =>
    sub.end_date && isSubscriptionExpiringSoon(sub.end_date, days)
  );

  return expiringSubscriptions.map(sub => ({
    member_id: sub.member_id,
    full_name: sub.member?.full_name || '',
    phone: sub.member?.phone || '',
    subscription_id: sub.subscription_id,
    package_name: sub.package?.name || '',
    end_date: sub.end_date,
  }));
}

export async function generatePdfReport() {
  const doc = new PDFDocument({ margin: 50 });
  const buffers = [];
  doc.on("data", buffers.push.bind(buffers));

  // Load font hỗ trợ tiếng Việt
  try {
    const fontPath = path.join(__dirname, "..", "fonts", "Roboto-Regular.ttf");
    doc.registerFont("Roboto", fontPath);
    doc.font("Roboto");
  } catch (error) {
    console.warn("Không thể tải font Roboto. Sử dụng font mặc định.", error);
    doc.font("Helvetica");
  }

  doc.fontSize(20).text("Báo cáo Quản lý Phòng Gym", { align: "center" });
  doc.moveDown();

  // Helper: Vẽ bảng có phân trang
  const drawTable = (doc, headers, data, dataKeys, columnWidths, cellPadding = 5, appendSummary = null) => {
    const tableX = 50;
    const rowHeight = 25;
    const pageHeight = doc.page.height;
    const bottomMargin = 50;
    let currentY = doc.y;

    const drawHeader = () => {
      let currentX = tableX;
      doc.fontSize(10).font("Roboto");
      headers.forEach((header, i) => {
        doc.rect(currentX, currentY, columnWidths[i], rowHeight).stroke();
        doc.text(header, currentX + cellPadding, currentY + cellPadding, {
          width: columnWidths[i] - 2 * cellPadding,
          align: "left",
        });
        currentX += columnWidths[i];
      });
      currentY += rowHeight;
    };

    drawHeader();

    const allRows = [...data];
    if (appendSummary) allRows.push(appendSummary);

    allRows.forEach((row) => {
      if (currentY + rowHeight > pageHeight - bottomMargin) {
        doc.addPage();
        currentY = 50;
        drawHeader();
      }

      let currentX = tableX;
      dataKeys.forEach((key, i) => {
        doc.rect(currentX, currentY, columnWidths[i], rowHeight).stroke();
        const rawValue = row[key];
        const text = rawValue != null ? (key === "total_revenue" ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(rawValue) : String(rawValue)) : "";
        doc.text(text, currentX + cellPadding, currentY + cellPadding, {
          width: columnWidths[i] - 2 * cellPadding,
          align: "left",
        });
        currentX += columnWidths[i];
      });
      currentY += rowHeight;
    });

    doc.moveDown();
  };

  // Thiết bị sử dụng nhiều nhất
  const topEquipment = await topEquipmentUsage();
  doc.moveDown(1);
  doc.fontSize(16).text("Thiết bị được sử dụng nhiều nhất:", { align: "left" });
  doc.moveDown(0.2);
  const lineY1 = doc.y;
  doc
    .moveTo(doc.page.margins.left, lineY1)
    .lineTo(doc.page.width - doc.page.margins.right, lineY1)
    .stroke();
  doc.moveDown(0.5);

  const topEquipmentHeaders = ["Tên thiết bị", "Số lượt sử dụng"];
  const topEquipmentDataKeys = ["name", "usage_count"];
  const topEquipmentColumnWidths = [300, 100];
  const topEquipmentData = topEquipment.map((item) => ({
    name: item.name,
    usage_count: item.usage_count,
  }));
  drawTable(doc, topEquipmentHeaders, topEquipmentData, topEquipmentDataKeys, topEquipmentColumnWidths);

  // Doanh thu theo gói

  const revenueByPackage = await revenueByPackageMonthly();
  doc.addPage();
  doc.fontSize(16).text("Doanh thu theo Gói (Hàng tháng):", { align: "left" });
  doc.moveDown(0.2);
  const lineY2 = doc.y;
  doc
    .moveTo(doc.page.margins.left, lineY2)
    .lineTo(doc.page.width - doc.page.margins.right, lineY2)
    .stroke();
  doc.moveDown(0.5);

  const revenueByPackageHeaders = ["Gói", "Tháng", "Doanh thu"];
  const revenueByPackageDataKeys = ["package_name", "ym", "total_revenue"];
  const revenueByPackageColumnWidths = [200, 100, 150];
  const revenueByPackageData = revenueByPackage.map((item) => ({
    package_name: item.package_name,
    ym: item.ym,
    total_revenue: item.total_revenue,
  }));

  const totalRevenue = revenueByPackage.reduce((sum, item) => sum + Number(item.total_revenue || 0), 0);
  const summaryRow = {
    package_name: "Tổng doanh thu",
    ym: "",
    total_revenue: totalRevenue,
  };

  drawTable(doc, revenueByPackageHeaders, revenueByPackageData, revenueByPackageDataKeys, revenueByPackageColumnWidths, 5, summaryRow);

  doc.end();

  return new Promise((resolve) => {
    doc.on("end", () => {
      const pdfBuffer = Buffer.concat(buffers);
      resolve(pdfBuffer);
    });
  });
}

export async function generateWordReport() {
  const topEquipment = await topEquipmentUsage();
  const revenueByPackage = await revenueByPackageMonthly();

  const children = [];

  // Tiêu đề chính
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "Báo cáo Quản lý Phòng Gym", bold: true, size: 40 })],
      alignment: "center",
    })
  );
  children.push(new Paragraph({ text: "" }));

  // Tiêu đề phần thiết bị
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "Thiết bị được sử dụng nhiều nhất:", bold: true, size: 32 })],
    })
  );
  children.push(new Paragraph({ text: "" }));

  // Bảng thiết bị
  const equipmentTableRows = [];

  // Header
  equipmentTableRows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "Tên thiết bị", bold: true })] })],
          width: { size: 70, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "Số lượt sử dụng", bold: true })] })],
          width: { size: 30, type: WidthType.PERCENTAGE },
        }),
      ],
    })
  );

  // Dữ liệu thiết bị
  topEquipment.forEach((item) => {
    equipmentTableRows.push(
      new TableRow({
        children: [new TableCell({ children: [new Paragraph(item.name)] }), new TableCell({ children: [new Paragraph(String(item.usage_count))] })],
      })
    );
  });

  const equipmentTable = new Table({
    rows: equipmentTableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  children.push(equipmentTable);

  // Xuống trang mới cho phần doanh thu
  children.push(new Paragraph({ text: "", pageBreakBefore: true }));

  // Tiêu đề doanh thu
  children.push(
    new Paragraph({
      children: [new TextRun({ text: "Doanh thu theo Gói (Hàng tháng):", bold: true, size: 32 })],
    })
  );
  children.push(new Paragraph({ text: "" }));

  // Bảng doanh thu
  const revenueTableRows = [];

  // Header
  revenueTableRows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "Gói", bold: true })] })],
          width: { size: 40, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "Tháng", bold: true })] })],
          width: { size: 30, type: WidthType.PERCENTAGE },
        }),
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "Doanh thu", bold: true })] })],
          width: { size: 30, type: WidthType.PERCENTAGE },
        }),
      ],
    })
  );

  // Dữ liệu doanh thu
  revenueByPackage.forEach((item) => {
    revenueTableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(item.package_name)] }),
          new TableCell({ children: [new Paragraph(item.ym)] }),
          new TableCell({
            children: [
              new Paragraph(
                new Intl.NumberFormat("vi-VN", {
                  style: "currency",
                  currency: "VND",
                }).format(item.total_revenue)
              ),
            ],
          }),
        ],
      })
    );
  });

  // Tổng doanh thu
  const totalRevenue = revenueByPackage.reduce((sum, item) => sum + Number(item.total_revenue || 0), 0);
  revenueTableRows.push(
    new TableRow({
      children: [
        new TableCell({
          children: [new Paragraph({ children: [new TextRun({ text: "Tổng doanh thu", bold: true })] })],
        }),
        new TableCell({ children: [new Paragraph("")] }),
        new TableCell({
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(totalRevenue),
                  bold: true,
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  const revenueTable = new Table({
    rows: revenueTableRows,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  children.push(revenueTable);

  const doc = new Document({
    sections: [
      {
        children: children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}

