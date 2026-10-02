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

app.register(helmet);

app.register(cors, {
  origin: false
});

app.register(rateLimit, {
  max: 100,
  timeWindow: "1 minute"
});

app.get("/", async () => {
  return {
    status: "online",
    service: "UNITREE Backend",
    version: "1.0.0"
  };
});

app.get("/health", async () => {
  return {
    status: "healthy"
  };
});
app.get("/db-test", async () => {
  const result = await db.query("SELECT NOW() AS time");
  return {
    status: "database connected",
    time: result.rows[0].time
  };
});
app.post("/auth/register", async (request, reply) => {
  try {
    const { username, password } = request.body || {};

    const user = await registerUser(db, username, password);

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

app.post("/auth/login", async (request, reply) => {
  try {
    const { username, password } = request.body || {};

    const user = await loginUser(db, username, password);

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
const PORT = process.env.PORT || 3000;

app.listen({
  port: PORT,
  host: "0.0.0.0"
});