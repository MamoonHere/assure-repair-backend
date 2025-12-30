const { getPool } = require("../config/database");

class Permission {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  static async findById(id) {
    const pool = getPool();
    const result = await pool.query("SELECT * FROM permissions WHERE id = $1", [id]);
    return result.rows[0] ? new Permission(result.rows[0]) : null;
  }

  static async findByName(name) {
    const pool = getPool();
    const result = await pool.query("SELECT * FROM permissions WHERE name = $1", [name]);
    return result.rows[0] ? new Permission(result.rows[0]) : null;
  }

  static async findAll() {
    const pool = getPool();
    const result = await pool.query("SELECT * FROM permissions ORDER BY name");
    return result.rows.map(row => new Permission(row));
  }

  static async create(name, description = null) {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query(
        `INSERT INTO permissions (name, description) 
         VALUES ($1, $2) 
         RETURNING *`,
        [name, description]
      );
      const permission = new Permission(result.rows[0]);
      const superAdminRole = await client.query(
        'SELECT id FROM roles WHERE name = $1',
        ['SUPER_ADMIN']
      );
      if (superAdminRole.rows.length > 0) {
        await client.query(
          `INSERT INTO role_permissions (role_id, permission_id)
           VALUES ($1, $2)
           ON CONFLICT (role_id, permission_id) DO NOTHING`,
          [superAdminRole.rows[0].id, permission.id]
        );
      }
      await client.query('COMMIT');
      return permission;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async update(name, description = null) {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE permissions 
       SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 
       RETURNING *`,
      [name, description, this.id]
    );
    if (result.rows[0]) {
      Object.assign(this, new Permission(result.rows[0]));
    }
    return this;
  }

  async delete() {
    const pool = getPool();
    await pool.query("DELETE FROM permissions WHERE id = $1", [this.id]);
  }

  async getRoles() {
    const pool = getPool();
    const result = await pool.query(
      `SELECT r.* FROM roles r
       INNER JOIN role_permissions rp ON r.id = rp.role_id
       WHERE rp.permission_id = $1
       ORDER BY r.name`,
      [this.id]
    );
    return result.rows;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Permission;


