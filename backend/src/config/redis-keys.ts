export const REDIS_KEYS = {
    SESSION_REVOKE: (sessionId: string) => `revoked:${sessionId}`,
    ROTATION_HISTORY: 'rotation:history',
    COOLDOWN: (type: "refresh" | "session") => `rotation:cooldown:${type}`, // type: 'refresh' or 'session'
    NOTIFICATIONS_LIST: (userId: string, limit: number) => `notifications:list:${userId}:${limit}`,
    NOTIFICATIONS_UNREAD_COUNT: (userId: string) => `notifications:unread-count:${userId}`,
};
