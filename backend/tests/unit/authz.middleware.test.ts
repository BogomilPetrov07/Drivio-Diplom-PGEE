import { authorizeMiddleware } from "../../src/middlewares/authz.middleware";

function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  };
}

describe("authorizeMiddleware", () => {
  it("returns 401 when req.user is missing", () => {
    const req = {} as any;
    const res = createRes();
    const next = vi.fn();

    authorizeMiddleware(["INSTRUCTOR"])(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: "Unauthorized: No user found" });
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 403 when user does not have required role", () => {
    const req = {
      user: { role: "STUDENT", roles: ["STUDENT"] },
    } as any;
    const res = createRes();
    const next = vi.fn();

    authorizeMiddleware(["INSTRUCTOR"])(req, res as any, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ message: "Forbidden: Access denied" });
    expect(next).not.toHaveBeenCalled();
  });

  it("calls next when one of user roles is allowed", () => {
    const req = {
      user: { role: "STUDENT", roles: ["STUDENT", "INSTRUCTOR"] },
    } as any;
    const res = createRes();
    const next = vi.fn();

    authorizeMiddleware(["INSTRUCTOR"])(req, res as any, next);

    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });
});

