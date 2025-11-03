import * as svc from '../services/reports.service.js';

export async function topEquipment(req, res, next) {
  try {
    res.json(await svc.topEquipmentUsage(req.query.limit || 10));
  } catch (e) {
    next(e);
  }
}

export async function revenueByPackage(req, res, next) {
  try {
    res.json(await svc.revenueByPackageMonthly());
  } catch (e) {
    next(e);
  }
}

export async function expiringSoon(req, res, next) {
  try {
    res.json(await svc.membersExpiringSoon(req.query.days || 7));
  } catch (e) {
    next(e);
  }
}

export async function exportPdfReport(req, res, next) {
  try {
    const pdfBuffer = await svc.generatePdfReport();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"');
    res.send(pdfBuffer);
  } catch (e) {
    next(e);
  }
}

export async function exportWordReport(req, res, next) {
  try {
    const wordBuffer = await svc.generateWordReport();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', 'attachment; filename="report.docx"');
    res.send(wordBuffer);
  } catch (e) {
    next(e);
  }
}
