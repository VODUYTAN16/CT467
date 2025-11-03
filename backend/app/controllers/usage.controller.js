import { pool } from '../config/db.js';

// Tạo bản ghi sử dụng thiết bị
export async function create(req, res, next) {
  try {
    const { member_id, equipment_id, use_date, start_time, end_time } =
      req.body;
    const [rs] = await pool.query(
      `INSERT INTO equipment_usage(member_id, equipment_id, use_date, start_time, end_time)
       VALUES(:member_id, :equipment_id, :use_date, :start_time, :end_time)`,
      { member_id, equipment_id, use_date, start_time, end_time }
    );
    res.status(201).json({ usage_id: rs.insertId, ...req.body });
  } catch (e) {
    next(e);
  }
}

// Danh sách theo filter
export async function list(req, res, next) {
  try {
    const { member_id, equipment_id, date } = req.query;
    let sql = `SELECT eu.*, e.name AS equipment_name, m.full_name AS member_name
               FROM equipment_usage eu
               JOIN equipment e ON e.equipment_id = eu.equipment_id
               JOIN members m   ON m.member_id    = eu.member_id
               WHERE 1=1`;
    const params = {};
    if (member_id) {
      sql += ' AND eu.member_id = :member_id';
      params.member_id = Number(member_id);
    }
    if (equipment_id) {
      sql += ' AND eu.equipment_id = :equipment_id';
      params.equipment_id = Number(equipment_id);
    }
    if (date) {
      sql += ' AND eu.use_date = :use_date';
      params.use_date = date;
    }
    sql += ' ORDER BY eu.use_date DESC, eu.start_time DESC';
    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

export async function getOne(req, res, next) {
  try {
    const id = Number(req.params.id);
    const [[row]] = await pool.query(
      `SELECT eu.*, e.name AS equipment_name, m.full_name AS member_name
       FROM equipment_usage eu
       JOIN equipment e ON e.equipment_id = eu.equipment_id
       JOIN members m   ON m.member_id    = eu.member_id
       WHERE eu.usage_id = :id`,
      { id }
    );
    if (!row) return res.status(404).json({ message: 'Usage not found' });
    res.json(row);
  } catch (e) {
    next(e);
  }
}

export async function listByMember(req, res, next) {
  try {
    const memberId = Number(req.params.memberId);
    const [rows] = await pool.query(
      `SELECT eu.*, e.name AS equipment_name
       FROM equipment_usage eu
       JOIN equipment e ON e.equipment_id = eu.equipment_id
       WHERE eu.member_id = :memberId
       ORDER BY eu.use_date DESC, eu.start_time DESC`,
      { memberId }
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

export async function listByEquipment(req, res, next) {
  try {
    const equipmentId = Number(req.params.equipmentId);
    const [rows] = await pool.query(
      `SELECT eu.*, m.full_name AS member_name
       FROM equipment_usage eu
       JOIN members m ON m.member_id = eu.member_id
       WHERE eu.equipment_id = :equipmentId
       ORDER BY eu.use_date DESC, eu.start_time DESC`,
      { equipmentId }
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    const [rs] = await pool.query(
      `DELETE FROM equipment_usage WHERE usage_id = :id`,
      { id }
    );
    if (rs.affectedRows === 0)
      return res.status(404).json({ message: 'Usage not found' });
    res.json({ message: 'Deleted', usage_id: id });
  } catch (e) {
    next(e);
  }
}
