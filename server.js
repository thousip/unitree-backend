const { registerUser, loginUser } = require("./auth");
const { Pool } = require("pg");

const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const Fastify = require("fastify");
const cors = require("@fastify/cors");
const helmet = require("@fastify/helmet");
const rateLimit = require("@fastify/rate-limit");

const app = Fastify({
  logger: true
});

// CORS
app.register(cors, {
  origin: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
});

// Security headers
app.register(helmet);

// Rate limiting
app.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute"
});

// Home
app.get("/", async () => {
  return {
    status: "online",
    service: "UNITREE Backend",
    version: "1.0.0"
  };
});

// Health check
app.get("/health", async () => {
  return {
    status: "healthy"
  };
});

// Database test
app.get("/db-test", async () => {
  const result = await db.query("SELECT NOW() AS time");

  return {
    status: "database connected",
    time: result.rows[0].time
  };
});

// Register
app.post("/auth/register", async (request, reply) => {
  try {
    const { username, password } = request.body || {};

    const user = await registerUser(
      db,
      username,
      password
    );

    return reply.code(201).send({
      success: true,
      user
    });

  } catch (error) {
    request.log.error(error);

    return reply.code(400).send({
      success: false,
      message: error.message
    });
  }
});

// Login
app.post("/auth/login", async (request, reply) => {
  try {
    const { username, password } = request.body || {};

    const user = await loginUser(
      db,
      username,
      password
    );

    return reply.send({
      success: true,
      user
    });

  } catch (error) {
    request.log.error(error);

    return reply.code(401).send({
      success: false,
      message: error.message
    });
  }
});

// Start server
const PORT = process.env.PORT || 3000;

app.listen({
  port: PORT,
  host: "0.0.0.0"
}).then(() => {
  console.log(`UNITREE Backend running on port ${PORT}`);
}).catch((error) => {
  app.log.error(error);
  process.exit(1);
});