import bcrypt from "bcrypt";

export const hash = (p: string) => bcrypt.hash(p, 10);
export const compare = (p: string, h: string) => bcrypt.compare(p, h);
