const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

let pool;

const options = {
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 2_000,
}

const createPool = () => {
  if (pool) return pool;
  pool = new Pool(options);
  pool.on('error', (err) => {
    console.error('PostgreSQL pool error:', err);
  });
  return pool;
};

const getPool = () => createPool();

const connectDB = async () => {
  const poolInstance = createPool();
  const client = await poolInstance.connect();
  client.release();
  console.log('PostgreSQL connected');
  await initializeTables();
  return poolInstance;
};

const closeDB = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('PostgreSQL connection closed');
  }
};

const initializeTables = async () => {
  const poolInstance = createPool();
  const client = await poolInstance.connect();

  try {
    await client.query('BEGIN');
    await client.query(`SELECT pg_advisory_lock(123456789)`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        last_login TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        token TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        description TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        PRIMARY KEY (role_id, permission_id)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_roles (
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
        PRIMARY KEY (user_id, role_id)
      );
    `);
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id SERIAL PRIMARY KEY,
        token TEXT UNIQUE NOT NULL,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        used BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);
    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
      BEFORE UPDATE ON users
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);
    await client.query(`
      DROP TRIGGER IF EXISTS update_roles_updated_at ON roles;
      CREATE TRIGGER update_roles_updated_at
      BEFORE UPDATE ON roles
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);
    await client.query(`
      DROP TRIGGER IF EXISTS update_permissions_updated_at ON permissions;
      CREATE TRIGGER update_permissions_updated_at
      BEFORE UPDATE ON permissions
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
    `);

    const superAdminRoleResult = await client.query(
      `INSERT INTO roles (name, description)
       VALUES ($1, $2)
       ON CONFLICT (name) DO NOTHING
       RETURNING id`,
      ['SUPER_ADMIN', 'Super Administrator with full system access']
    );
    let superAdminRoleId;
    if (superAdminRoleResult.rows.length > 0) {
      superAdminRoleId = superAdminRoleResult.rows[0].id;
    } else {
      const existingRole = await client.query(
        'SELECT id FROM roles WHERE name = $1',
        ['SUPER_ADMIN']
      );
      superAdminRoleId = existingRole.rows[0].id;
    }

    const basicEmployeeRoleResult = await client.query(
      `INSERT INTO roles (name, description)
       VALUES ($1, $2)
       ON CONFLICT (name) DO NOTHING
       RETURNING id`,
      ['BASIC_EMPLOYEE', 'Basic employee role with standard access']
    );
    let basicEmployeeRoleId;
    if (basicEmployeeRoleResult.rows.length > 0) {
      basicEmployeeRoleId = basicEmployeeRoleResult.rows[0].id;
    } else {
      const existingRole = await client.query(
        'SELECT id FROM roles WHERE name = $1',
        ['BASIC_EMPLOYEE']
      );
      basicEmployeeRoleId = existingRole.rows[0].id;
    }

    const permissions = [
      { name: 'USERS.MANAGE', description: 'Manage users (create, update, delete)' },
      { name: 'RBAC.MANAGE', description: 'Manage roles and permissions' },
      { name: 'LIVE.MAP.MANAGE', description: 'Manage live map features' }
    ];
    
    const permissionIds = [];
    let liveMapManagePermId = null;
    for (const perm of permissions) {
      const permResult = await client.query(
        `INSERT INTO permissions (name, description)
         VALUES ($1, $2)
         ON CONFLICT (name) DO NOTHING
         RETURNING id`,
        [perm.name, perm.description]
      );
      
      let permId;
      if (permResult.rows.length > 0) {
        permId = permResult.rows[0].id;
      } else {
        const existingPerm = await client.query(
          'SELECT id FROM permissions WHERE name = $1',
          [perm.name]
        );
        permId = existingPerm.rows[0].id;
      }
      permissionIds.push(permId);
      if (perm.name === 'LIVE.MAP.MANAGE') {
        liveMapManagePermId = permId;
      }
    }
    for (const permId of permissionIds) {
      await client.query(
        `INSERT INTO role_permissions (role_id, permission_id)
         VALUES ($1, $2)
         ON CONFLICT (role_id, permission_id) DO NOTHING`,
        [superAdminRoleId, permId]
      );
    }
    if (liveMapManagePermId) {
      await client.query(
        `INSERT INTO role_permissions (role_id, permission_id)
         VALUES ($1, $2)
         ON CONFLICT (role_id, permission_id) DO NOTHING`,
        [basicEmployeeRoleId, liveMapManagePermId]
      );
    }
    await client.query('COMMIT');
    console.log('Database schema initialized');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Schema initialization failed:', err);
    throw err;
  } finally {
    await client.query(`SELECT pg_advisory_unlock(123456789)`);
    client.release();
  }
};

module.exports = {
  connectDB,
  getPool,
  closeDB,
};
