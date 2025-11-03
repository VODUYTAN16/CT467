import { pool } from '../config/db.js';

export async function list(req, res, next) {
  try {
    const { status } = req.query; // 'Hoạt động' | 'Bảo trì' | 'Hỏng'
    let rows;
    if (status) {
      [rows] = await pool.query(
        `SELECT * FROM equipment WHERE status = :status ORDER BY name ASC`,
        { status }
      );
    } else {
      [rows] = await pool.query(`SELECT * FROM equipment ORDER BY name ASC`);
    }
    res.json(rows);
  } catch (e) {
    next(e);
  }
}

export async function getOne(req, res, next) {
  try {
    const id = Number(req.params.id);
    const [[row]] = await pool.query(
      `SELECT * FROM equipment WHERE equipment_id = :id`,
      { id }
    );
    if (!row) return res.status(404).json({ message: 'Equipment not found' });
    res.json(row);
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const { name, type, status = 'Hoạt động' } = req.body;
    const [rs] = await pool.query(
      `INSERT INTO equipment(name, type, status) VALUES(:name, :type, :status)`,
      { name, type, status }
    );
    res.status(201).json({ equipment_id: rs.insertId, ...req.body });
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { name, type, status } = req.body;
    const [rs] = await pool.query(
      `UPDATE equipment SET name=:name, type=:type, status=:status WHERE equipment_id=:id`,
      { id, name, type, status }
    );
    if (rs.affectedRows === 0)
      return res.status(404).json({ message: 'Equipment not found' });
    res.json({ equipment_id: id, ...req.body });
  } catch (e) {
    next(e);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { status } = req.body; // 'Hoạt động' | 'Bảo trì' | 'Hỏng'
    const [rs] = await pool.query(
      `UPDATE equipment SET status=:status WHERE equipment_id=:id`,
      { id, status }
    );
    if (rs.affectedRows === 0)
      return res.status(404).json({ message: 'Equipment not found' });
    res.json({ equipment_id: id, status });
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    const [rs] = await pool.query(
      `DELETE FROM equipment WHERE equipment_id = :id`,
      { id }
    );
    if (rs.affectedRows === 0)
      return res.status(404).json({ message: 'Equipment not found' });
    res.json({ message: 'Deleted', equipment_id: id });
  } catch (e) {
    next(e);
  }
}
