import { asc } from "drizzle-orm";
import { db } from "../../config/drizzle.js";
import { schools } from "../../../drizzle/schemas/index.js";

export class PublicService {
  static async listSchools() {
    return db.query.schools.findMany({
      columns: {
        id: true,
        name: true,
        region: true,
        city: true,
        address: true,
        phone: true,
        rating: true,
      },
      orderBy: [asc(schools.name)],
    });
  }
}
