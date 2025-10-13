import { pool } from '../config/db.js';

export async function list(req, res, next) {
  try {
    const q = (req.query.q || '').trim();
    let rows;
    if (q) {
      [rows] = await pool.query(
        `SELECT * FROM packages WHERE name LIKE :kw OR description LIKE :kw ORDER BY created_at DESC`,
        { kw: `%${q}%` }
      );
    } else {
      [rows] = await pool.query(
        `SELECT * FROM packages ORDER BY created_at DESC`
      );
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
      `SELECT * FROM packages WHERE package_id = :id`,
      { id }
    );
    if (!row) return res.status(404).json({ message: 'Package not found' });
    res.json(row);
  } catch (e) {
    next(e);
  }
}

export async function create(req, res, next) {
  try {
    const { name, duration_months, price, description, sessions_per_week } =
      req.body;
    const [rs] = await pool.query(
      `INSERT INTO packages(name, duration_months, price, description, sessions_per_week)
       VALUES(:name, :duration_months, :price, :description, :sessions_per_week)`,
      { name, duration_months, price, description, sessions_per_week }
    );
    res.status(201).json({ package_id: rs.insertId, ...req.body });
  } catch (e) {
    next(e);
  }
}

export async function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const { name, duration_months, price, description, sessions_per_week } =
      req.body;
    const [rs] = await pool.query(
      `UPDATE packages
       SET name=:name, duration_months=:duration_months, price=:price,
           description=:description, sessions_per_week=:sessions_per_week
       WHERE package_id=:id`,
      { id, name, duration_months, price, description, sessions_per_week }
    );
    if (rs.affectedRows === 0)
      return res.status(404).json({ message: 'Package not found' });
    res.json({ package_id: id, ...req.body });
  } catch (e) {
    next(e);
  }
}

export async function remove(req, res, next) {
  try {
    const id = Number(req.params.id);
    const [rs] = await pool.query(
      `DELETE FROM packages WHERE package_id = :id`,
      { id }
    );
    if (rs.affectedRows === 0)
      return res.status(404).json({ message: 'Package not found' });
    res.json({ message: 'Deleted', package_id: id });
  } catch (e) {
    next(e);
  }
}
