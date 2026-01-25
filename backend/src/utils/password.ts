import argon2 from "argon2";

export const hash = async (p: string) => {
    return await argon2.hash(p);
};

export const compare = async (p: string, h: string) => {
    try {
        return await argon2.verify(h, p);
    } catch (err) {
        return false;
    }
};