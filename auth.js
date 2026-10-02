const argon2 = require("argon2");

async function registerUser(db, username, password) {
  const cleanUsername = String(username || "").trim();

  if (!cleanUsername || !password) {
    throw new Error("Username and password are required");
  }

  if (cleanUsername.length < 3 || cleanUsername.length > 50) {
    throw new Error("Username must be 3-50 characters");
  }

  if (String(password).length < 8) {
    throw new Error("Password must be at least 8 characters");
  }

  const existing = await db.query(
    "SELECT id FROM users WHERE username = $1",
    [cleanUsername]
  );

  if (existing.rows.length > 0) {
    throw new Error("Username already exists");
  }

  const passwordHash = await argon2.hash(password);

  const client = await db.connect();

  try {
    await client.query("BEGIN");

    const userResult = await client.query(
      `INSERT INTO users (username, password_hash)
       VALUES ($1, $2)
       RETURNING id, username, role, is_active, created_at`,
      [cleanUsername, passwordHash]
    );

    const user = userResult.rows[0];

    await client.query(
      `INSERT INTO wallets (user_id, balance)
       VALUES ($1, 0)`,
      [user.id]
    );

    await client.query(
      `INSERT INTO audit_logs (user_id, action, details)
       VALUES ($1, $2, $3)`,
      [user.id, "ACCOUNT_CREATED", JSON.stringify({ username: user.username })]
    );

    await client.query("COMMIT");

    return user;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function loginUser(db, username, password) {
  const cleanUsername = String(username || "").trim();

  if (!cleanUsername || !password) {
    throw new Error("Username and password are required");
  }

  const result = await db.query(
    `SELECT id, username, password_hash, role, is_active
     FROM users
     WHERE username = $1`,
    [cleanUsername]
  );

  if (result.rows.length === 0) {
    throw new Error("Invalid username or password");
  }

  const user = result.rows[0];

  if (!user.is_active) {
    throw new Error("Account is disabled");
  }

  const validPassword = await argon2.verify(
    user.password_hash,
    password
  );

  if (!validPassword) {
    throw new Error("Invalid username or password");
  }

  await db.query(
    `INSERT INTO audit_logs (user_id, action, details)
     VALUES ($1, $2, $3)`,
    [user.id, "LOGIN", JSON.stringify({ username: user.username })]
  );

  return {
    id: user.id,
    username: user.username,
    role: user.role
  };
}

module.exports = {
  registerUser,
  loginUser
};