import 'dotenv/config';
import app from './app.js';
import { pool } from './app/config/db.js';

const port = process.env.PORT || 3000;

async function boot() {
  // kiểm tra DB
  await pool.query('SELECT 1');
  app.listen(port, () => console.log(`Gym API listening on :${port}`));
}
boot().catch((e) => {
  console.error('Cannot start server:', e);
  process.exit(1);
});
