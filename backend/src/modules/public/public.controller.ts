import { Request, Response } from "express";
import { PublicService } from "./public.service.js";

export class PublicController {
  static listSchools = async (_req: Request, res: Response) => {
    const schools = await PublicService.listSchools();
    return res.status(200).json({ schools });
  };
}
