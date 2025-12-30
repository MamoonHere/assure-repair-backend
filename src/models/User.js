const bcrypt = require("bcryptjs");
const { getPool } = require("../config/database");

class User {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.password = data.password;
    this.firstName = data.first_name;
    this.lastName = data.last_name;
    this.lastLogin = data.last_login;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  static async findByEmail(email) {
    const pool = getPool();
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [
      email.toLowerCase().trim(),
    ]);
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  static async findById(id) {
    const pool = getPool();
    const result = await pool.query("SELECT * FROM users WHERE id = $1", [id]);
    return result.rows[0] ? new User(result.rows[0]) : null;
  }

  static async create(email, password, firstName, lastName) {
    const pool = getPool();
    const hashedPassword = password ? await bcrypt.hash(password, 12) : null;

    const result = await pool.query(
      `INSERT INTO users (email, password, first_name, last_name) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, first_name, last_name, created_at, updated_at, last_login`,
      [email.trim(), hashedPassword, firstName, lastName]
    );

    const userData = result.rows[0];
    return {
      id: userData.id,
      email: userData.email,
      firstName: userData.first_name,
      lastName: userData.last_name,
      createdAt: userData.created_at,
      updatedAt: userData.updated_at,
      lastLogin: userData.last_login,
    };
  }

  async update(firstName, lastName, email) {
    const pool = getPool();
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (firstName !== undefined) {
      updates.push(`first_name = $${paramCount++}`);
      values.push(firstName);
    }
    if (lastName !== undefined) {
      updates.push(`last_name = $${paramCount++}`);
      values.push(lastName);
    }
    if (email !== undefined) {
      updates.push(`email = $${paramCount++}`);
      values.push(email.trim());
    }

    if (updates.length === 0) {
      return this;
    }

    values.push(this.id);
    const result = await pool.query(
      `UPDATE users 
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows[0]) {
      Object.assign(this, new User(result.rows[0]));
    }
    return this;
  }

  async setPassword(newPassword) {
    const pool = getPool();
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const result = await pool.query(
      `UPDATE users 
       SET password = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [hashedPassword, this.id]
    );
    if (result.rows[0]) {
      this.password = result.rows[0].password;
    }
    return this;
  }

  async delete() {
    const pool = getPool();
    await pool.query('DELETE FROM users WHERE id = $1', [this.id]);
  }

  async comparePassword(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  }

  async updateLastLogin() {
    const pool = getPool();
    await pool.query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
      [this.id]
    );
    this.lastLogin = new Date();
  }

  toSafeObject() {
    return {
      id: this.id,
      email: this.email,
      firstName: this.firstName,
      lastName: this.lastName,
      lastLogin: this.lastLogin,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = User;
