import { Server as HttpServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { env } from "../config/env";

let io: SocketIOServer | null = null;

export function initSocketIO(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.WEB_APP_URL,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    // Guests join a room scoped to the event they're viewing.
    socket.on("event:join", (eventId: string) => {
      if (typeof eventId === "string" && eventId.length > 0) {
        socket.join(`event:${eventId}`);
      }
    });

    socket.on("event:leave", (eventId: string) => {
      if (typeof eventId === "string" && eventId.length > 0) {
        socket.leave(`event:${eventId}`);
      }
    });
  });

  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error("Socket.IO has not been initialized yet");
  }
  return io;
}
