import { pool } from "../config/db.js";
import PDFDocument from "pdfkit";
import { Document, Packer, Paragraph, TextRun } from "docx";
import path from 'path';
import { fileURLToPath } from 'url';

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
  const [rows] = await pool.query(`CALL sp_members_expiring_soon(:d)`, {
    d: Number(days),
  });
  // mysql2 returns [ [rows], [metadata] ] for CALL, take first result set:
  return rows[0] ?? [];
}

export async function generatePdfReport() {
  const doc = new PDFDocument();
  const buffers = [];
  doc.on("data", buffers.push.bind(buffers));
  doc.on("end", () => {});
  try {
    const fontPath = path.join(__dirname, '..', 'fonts', 'Roboto-Regular.ttf');
    doc.font(fontPath); // Using Roboto-Regular.ttf for Vietnamese support
  } catch (error) {
    console.warn("Could not load custom font for PDF. Using default font. Vietnamese characters might not display correctly.", error);
  }

  doc.fontSize(20).text("Gym Management Report", { align: "center" });
  doc.moveDown();

  const topEquipment = await topEquipmentUsage();
  doc.fontSize(16).text("Top Equipment Usage:");
  doc.fontSize(12);
  topEquipment.forEach((item) => {
    doc.text(`- ${item.name}: ${item.usage_count} usages`);
  });
  doc.moveDown();

  const revenueByPackage = await revenueByPackageMonthly();
  doc.fontSize(16).text("Revenue by Package (Monthly):");
  doc.fontSize(12);
  revenueByPackage.forEach((item) => {
    doc.text(`- ${item.package_name} (${item.ym}): ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.total_revenue)}`);
  });
  doc.moveDown();

  const expiringMembers = await membersExpiringSoon();
  doc.fontSize(16).text("Members Expiring Soon:");
  doc.fontSize(12);
  expiringMembers.forEach((item) => {
    doc.text(`- ${item.full_name} (Phone: ${item.phone}, Package: ${item.package_name}, Expires: ${item.end_date})`);
  });
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
  const expiringMembers = await membersExpiringSoon();

  const children = [];

  children.push(
    new Paragraph({
      children: [new TextRun({ text: "Gym Management Report", bold: true, size: 40 })],
      alignment: "center",
    })
  );
  children.push(new Paragraph({ text: "" })); // Spacer

  children.push(
    new Paragraph({
      children: [new TextRun({ text: "Top Equipment Usage:", bold: true, size: 32 })],
    })
  );
  topEquipment.forEach((item) => {
    children.push(new Paragraph(`- ${item.name}: ${item.usage_count} usages`));
  });
  children.push(new Paragraph({ text: "" })); // Spacer

  children.push(
    new Paragraph({
      children: [new TextRun({ text: "Revenue by Package (Monthly):", bold: true, size: 32 })],
    })
  );
  revenueByPackage.forEach((item) => {
    children.push(new Paragraph(`- ${item.package_name} (${item.ym}): ${new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(item.total_revenue)}`));
  });
  children.push(new Paragraph({ text: "" })); // Spacer

  children.push(
    new Paragraph({
      children: [new TextRun({ text: "Members Expiring Soon:", bold: true, size: 32 })],
    })
  );
  expiringMembers.forEach((item) => {
    children.push(new Paragraph(`- ${item.full_name} (Phone: ${item.phone}, Package: ${item.package_name}, Expires: ${item.end_date})`));
  });

  const doc = new Document({
    sections: [
      {
        children: children,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
