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
    type: boolean;
}

export interface AuthPayload {
    userId: string;
    role: string;
    sessionId: string;
}
