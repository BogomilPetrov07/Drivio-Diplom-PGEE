import { Router } from "express";
import { SupportController } from "./support.controller.js";
import { authenticateMiddleware } from "../../middlewares/authn.middleware.js";
import { authorizeMiddleware } from "../../middlewares/authz.middleware.js";

const router = Router();

router.post("/question", SupportController.submitPublicQuestion);
router.post("/inbound", SupportController.receiveInboundReply);
router.post("/user-question", authenticateMiddleware, SupportController.submitUserQuestion);
router.get("/user/threads", authenticateMiddleware, SupportController.listUserThreads);
router.get("/user/threads/:threadId/messages", authenticateMiddleware, SupportController.getUserThreadMessages);
router.post("/user/threads/:threadId/reply", authenticateMiddleware, SupportController.replyAsUser);
router.get("/admin/threads", authenticateMiddleware, authorizeMiddleware(["SUPERADMIN"]), SupportController.listAdminThreads);
router.get("/admin/threads/:threadId/messages", authenticateMiddleware, authorizeMiddleware(["SUPERADMIN"]), SupportController.getAdminThreadMessages);
router.post("/admin/threads/:threadId/reply", authenticateMiddleware, authorizeMiddleware(["SUPERADMIN"]), SupportController.replyAsAdmin);
router.post("/admin/threads/:threadId/close", authenticateMiddleware, authorizeMiddleware(["SUPERADMIN"]), SupportController.closeAsAdmin);
router.delete("/admin/threads/:threadId", authenticateMiddleware, authorizeMiddleware(["SUPERADMIN"]), SupportController.deleteClosedAsAdmin);

export default router;
