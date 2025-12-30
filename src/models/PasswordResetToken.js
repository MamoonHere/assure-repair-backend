const crypto = require("crypto");
const { getPool } = require("../config/database");

class PasswordResetToken {
  constructor(data) {
    this.id = data.id;
    this.token = data.token;
    this.userId = data.user_id;
    this.expiresAt = data.expires_at;
    this.used = data.used;
    this.createdAt = data.created_at;
  }

  static generateToken() {
    return crypto.randomBytes(40).toString("hex");
  }

  static hashToken(token) {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  static async findByToken(token) {
    const pool = getPool();
    const tokenHash = this.hashToken(token);
    const result = await pool.query(
      "SELECT * FROM password_reset_tokens WHERE token = $1 AND used = FALSE",
      [tokenHash]
    );
    return result.rows[0] ? new PasswordResetToken(result.rows[0]) : null;
  }

  static async findByUserId(userId) {
    const pool = getPool();
    const result = await pool.query(
      "SELECT * FROM password_reset_tokens WHERE user_id = $1 AND used = FALSE ORDER BY created_at DESC",
      [userId]
    );
    return result.rows.map((row) => new PasswordResetToken(row));
  }

  static async create(token, userId, expiresAt) {
    const pool = getPool();
    const tokenHash = this.hashToken(token);
    const expiresAtValue =
      expiresAt instanceof Date
        ? expiresAt.toISOString()
        : new Date(expiresAt).toISOString();
    await pool.query(
      "UPDATE password_reset_tokens SET used = TRUE WHERE user_id = $1 AND used = FALSE",
      [userId]
    );

    const result = await pool.query(
      `INSERT INTO password_reset_tokens (token, user_id, expires_at) 
       VALUES ($1, $2, $3::TIMESTAMPTZ) 
       RETURNING *`,
      [tokenHash, userId, expiresAtValue]
    );
    return new PasswordResetToken(result.rows[0]);
  }

  isValid() {
    if (this.used) return false;
    const expiryDate =
      this.expiresAt instanceof Date
        ? this.expiresAt
        : new Date(this.expiresAt);
    const now = new Date();
    return expiryDate.getTime() > now.getTime();
  }

  async markAsUsed() {
    const pool = getPool();
    await pool.query(
      "UPDATE password_reset_tokens SET used = TRUE WHERE id = $1",
      [this.id]
    );
    this.used = true;
  }

  async delete() {
    const pool = getPool();
    await pool.query("DELETE FROM password_reset_tokens WHERE id = $1", [
      this.id,
    ]);
  }
}

module.exports = PasswordResetToken;
