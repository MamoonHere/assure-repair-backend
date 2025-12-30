const { getPool } = require("../config/database");

class Role {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  static async findById(id) {
    const pool = getPool();
    const result = await pool.query("SELECT * FROM roles WHERE id = $1", [id]);
    return result.rows[0] ? new Role(result.rows[0]) : null;
  }

  static async findByName(name) {
    const pool = getPool();
    const result = await pool.query("SELECT * FROM roles WHERE name = $1", [name]);
    return result.rows[0] ? new Role(result.rows[0]) : null;
  }

  static async findAll() {
    const pool = getPool();
    const result = await pool.query("SELECT * FROM roles ORDER BY name");
    return result.rows.map(row => new Role(row));
  }

  static async create(name, description = null) {
    const pool = getPool();
    const result = await pool.query(
      `INSERT INTO roles (name, description) 
       VALUES ($1, $2) 
       RETURNING *`,
      [name, description]
    );
    return new Role(result.rows[0]);
  }

  async update(name, description = null) {
    const pool = getPool();
    const result = await pool.query(
      `UPDATE roles 
       SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 
       RETURNING *`,
      [name, description, this.id]
    );
    if (result.rows[0]) {
      Object.assign(this, new Role(result.rows[0]));
    }
    return this;
  }

  async delete() {
    const pool = getPool();
    await pool.query("DELETE FROM roles WHERE id = $1", [this.id]);
  }

  async getPermissions() {
    const pool = getPool();
    const result = await pool.query(
      `SELECT p.* FROM permissions p
       INNER JOIN role_permissions rp ON p.id = rp.permission_id
       WHERE rp.role_id = $1
       ORDER BY p.name`,
      [this.id]
    );
    return result.rows;
  }

  async addPermission(permissionId) {
    const pool = getPool();
    await pool.query(
      `INSERT INTO role_permissions (role_id, permission_id)
       VALUES ($1, $2)
       ON CONFLICT (role_id, permission_id) DO NOTHING`,
      [this.id, permissionId]
    );
  }

  async removePermission(permissionId) {
    if (this.name === 'SUPER_ADMIN') {
      throw new Error('Cannot remove permissions from SUPER_ADMIN role');
    }
    const pool = getPool();
    await pool.query(
      `DELETE FROM role_permissions 
       WHERE role_id = $1 AND permission_id = $2`,
      [this.id, permissionId]
    );
  }

  async setPermissions(permissionIds) {
    const pool = getPool();
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      if (this.name === 'SUPER_ADMIN') {
        const currentPermsResult = await client.query(
          'SELECT permission_id FROM role_permissions WHERE role_id = $1',
          [this.id]
        );
        const currentPermissionIds = currentPermsResult.rows.map(row => row.permission_id);
        const newPermissionIds = permissionIds || [];
        const finalPermissionIds = [...new Set([...currentPermissionIds, ...newPermissionIds])];
        await client.query(
          'DELETE FROM role_permissions WHERE role_id = $1',
          [this.id]
        );
        if (finalPermissionIds.length > 0) {
          const values = finalPermissionIds.map((_, index) => 
            `($1, $${index + 2})`
          ).join(', ');
          const query = `INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`;
          await client.query(query, [this.id, ...finalPermissionIds]);
        }
      } else {
        await client.query(
          'DELETE FROM role_permissions WHERE role_id = $1',
          [this.id]
        );
        if (permissionIds && permissionIds.length > 0) {
          const values = permissionIds.map((_, index) => 
            `($1, $${index + 2})`
          ).join(', ');
          const query = `INSERT INTO role_permissions (role_id, permission_id) VALUES ${values}`;
          await client.query(query, [this.id, ...permissionIds]);
        }
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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

module.exports = Role;

