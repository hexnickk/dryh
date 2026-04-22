import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io";

import {
  SOCKET_PATH,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from "../src/lib/socket";

const dev = process.env.NODE_ENV !== "production";
const HOST = process.env.HOST ?? (dev ? "0.0.0.0" : "127.0.0.1");
const PORT = Number(process.env.PORT ?? 3000);

const app = next({
  dev,
  hostname: HOST,
  port: PORT,
});

const handle = app.getRequestHandler();

const start = async () => {
  await app.prepare();

  const httpServer = createServer((req, res) => {
    if (req.url?.startsWith(SOCKET_PATH)) {
      return;
    }

    void handle(req, res).catch((error) => {
      console.error("Failed to handle request", error);
      res.statusCode = 500;
      res.end("Internal server error");
    });
  });

  const io = new Server<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    {
      path: SOCKET_PATH,
    }
  );

  io.on("connection", (socket) => {
    console.log("A user connected:", socket.id);

    socket.on("send_msg", (data) => {
      io.emit("receive_msg", data);
    });

    socket.on("disconnect", () => {
      console.log("A user disconnected:", socket.id);
    });
  });

  httpServer.listen(PORT, HOST, () => {
    const displayHost = HOST === "0.0.0.0" ? "localhost" : HOST;
    console.log(`> Ready on http://${displayHost}:${PORT}`);
    console.log(`> Socket.IO listening on ws://${displayHost}:${PORT}${SOCKET_PATH}`);
  });
};

start().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
