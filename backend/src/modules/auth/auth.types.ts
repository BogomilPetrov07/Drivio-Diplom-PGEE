export interface LoginDTO {
    username: string;
    password: string;
}

export interface RegisterDTO extends LoginDTO {
    role: string;
    email: string;
    // firstName: string;
    // lastName: string;
    // age: number;
    // gender: string;
    // phone: string;
}

export interface RotateDTO {
    type: "refresh" | "session";
}

export interface SessionDTO {
    id: string
    revoked: boolean
    userId: string
    signature: string | null
}

export interface RefreshTokenDTO {
    id: string
    revoked: boolean
    signature: string | null
    tokenHash: string
}

export interface RefreshTokenCollectionItem {
    id: string;
}

// This makes the DTO itself an Array type
export type RefreshTokenCollectionDTO = RefreshTokenCollectionItem[];

export interface AuthPayload {
    userId: string;
    role: string;
    sessionId: string;
}
