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

const PORT = process.env.PORT || 3000;

app.listen({
  port: PORT,
  host: "0.0.0.0"
});