import type { NextFunction } from "express";
import { authenticateMiddleware } from "../../src/middlewares/authn.middleware";
import { verifyAccessToken } from "../../src/utils/jwt.js";
import { redis } from "../../src/config/redis.js";
import { AuthService } from "../../src/modules/auth/auth.service.js";

vi.mock("../../src/utils/jwt.js", () => ({
  verifyAccessToken: vi.fn(),
}));

vi.mock("../../src/config/redis.js", () => ({
  redis: {
    get: vi.fn(),
  },
}));

vi.mock("../../src/modules/auth/auth.service.js", () => ({
  AuthService: {
    isSessionActive: vi.fn(),
  },
}));

describe("authenticateMiddleware", () => {
  const sendStatus = vi.fn();
  const next: NextFunction = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when token is missing", async () => {
    const req = { cookies: {} } as any;
    const res = { sendStatus } as any;

    await authenticateMiddleware(req, res, next);

    expect(sendStatus).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when session is revoked", async () => {
    const req = { cookies: { accessToken: "token" } } as any;
    const res = { sendStatus } as any;

    vi.mocked(verifyAccessToken).mockResolvedValue({
      isValid: true,
      userId: "u1",
      role: "INSTRUCTOR",
      roles: ["INSTRUCTOR"],
      activeRole: "INSTRUCTOR",
      sessionId: "s1",
    } as any);
    vi.mocked(redis.get).mockResolvedValue("1" as any);

    await authenticateMiddleware(req, res, next);

    expect(sendStatus).toHaveBeenCalledWith(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("sets req.user and calls next for valid session", async () => {
    const req = { cookies: { accessToken: "token" } } as any;
    const res = { sendStatus } as any;

    vi.mocked(verifyAccessToken).mockResolvedValue({
      isValid: true,
      userId: "u42",
      role: "INSTRUCTOR",
      roles: ["INSTRUCTOR"],
      activeRole: "INSTRUCTOR",
      sessionId: "session-42",
    } as any);
    vi.mocked(redis.get).mockResolvedValue(null as any);
    vi.mocked(AuthService.isSessionActive).mockResolvedValue(true as any);

    await authenticateMiddleware(req, res, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toMatchObject({
      id: "u42",
      role: "INSTRUCTOR",
      sessionId: "session-42",
    });
    expect(sendStatus).not.toHaveBeenCalled();
  });
});

