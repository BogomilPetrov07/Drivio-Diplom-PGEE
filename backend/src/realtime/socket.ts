import { Server } from "socket.io";
import { AuthService } from "../modules/auth/auth.service.js";
import { verifyAccessToken } from "../utils/jwt.js";

let ioRef: Server | null = null;

function parseCookies(raw: string | undefined) {
  if (!raw) return {} as Record<string, string>;
  return raw.split(";").reduce<Record<string, string>>((acc, pair) => {
    const [key, ...rest] = pair.trim().split("=");
    if (!key) return acc;
    acc[key] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}

export function initSocket(server: Parameters<Server["listen"]>[0]) {
  const io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers.cookie);
      const token = cookies["accessToken"];
      if (!token) return next(new Error("Unauthorized"));
      const decoded = await verifyAccessToken(token);
      if (!decoded.isValid || !decoded.userId || !decoded.role) {
        return next(new Error("Unauthorized"));
      }
      const sessionActive = await AuthService.isSessionActive(decoded.sessionId, decoded.userId);
      if (!sessionActive) return next(new Error("Unauthorized"));

      socket.data.userId = decoded.userId;
      socket.data.role = decoded.role;
      socket.data.sessionId = decoded.sessionId;
      return next();
    } catch {
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.data.userId as string;
    const role = socket.data.role as string;
    const sessionId = socket.data.sessionId as string;
    socket.join(`user:${userId}`);
    socket.join(`role:${role}`);

    const sessionCheckInterval = setInterval(async () => {
      const active = await AuthService.isSessionActive(sessionId, userId);
      if (!active) {
        socket.disconnect(true);
      }
    }, 60_000);

    socket.on("disconnect", () => {
      clearInterval(sessionCheckInterval);
    });
  });

  ioRef = io;
  return io;
}

export function getSocket() {
  return ioRef;
}

export function emitToUser(userId: string, event: string, payload: unknown) {
  ioRef?.to(`user:${userId}`).emit(event, payload);
}

export function emitToRole(role: string, event: string, payload: unknown) {
  ioRef?.to(`role:${role}`).emit(event, payload);
}

export function emitToRoles(roles: string[], event: string, payload: unknown) {
  roles.forEach((role) => ioRef?.to(`role:${role}`).emit(event, payload));
}
