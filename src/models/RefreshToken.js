const crypto = require('crypto');
const { getPool } = require('../config/database');

class RefreshToken {
  constructor(data) {
    this.id = data.id;
    this.token = data.token;
    this.userId = data.user_id;
    this.expiresAt = data.expires_at;
    this.createdAt = data.created_at;
  }

  static generateToken() {
    return crypto.randomBytes(40).toString('hex');
  }

  static hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  static async findByToken(token) {
    const pool = getPool();
    const tokenHash = this.hashToken(token);
    const result = await pool.query(
      'SELECT * FROM refresh_tokens WHERE token = $1',
      [tokenHash]
    );
    return result.rows[0] ? new RefreshToken(result.rows[0]) : null;
  }

  static async findByUser(userId) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM refresh_tokens WHERE user_id = $1',
      [userId]
    );
    return result.rows.map(row => new RefreshToken(row));
  }

  static async create(token, userId, expiresAt) {
    const pool = getPool();
    const tokenHash = this.hashToken(token);
    const expiresAtValue = expiresAt instanceof Date 
      ? expiresAt.toISOString() 
      : new Date(expiresAt).toISOString();
    
    const result = await pool.query(
      `INSERT INTO refresh_tokens (token, user_id, expires_at) 
       VALUES ($1, $2, $3::TIMESTAMPTZ) 
       RETURNING *`,
      [tokenHash, userId, expiresAtValue]
    );
    return new RefreshToken(result.rows[0]);
  }

  static async getAllTokensByUser(userId) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT token, expires_at FROM refresh_tokens WHERE user_id = $1',
      [userId]
    );
    return result.rows;
  }

  static async deleteAllByUser(userId) {
    const pool = getPool();
    await pool.query(
      'DELETE FROM refresh_tokens WHERE user_id = $1',
      [userId]
    );
  }

  isValid() {
    const expiryDate = this.expiresAt instanceof Date 
      ? this.expiresAt 
      : new Date(this.expiresAt);
    const now = new Date();
    return expiryDate.getTime() > now.getTime();
  }

  async delete() {
    const pool = getPool();
    await pool.query(
      'DELETE FROM refresh_tokens WHERE id = $1',
      [this.id]
    );
  }
}

module.exports = RefreshToken;
