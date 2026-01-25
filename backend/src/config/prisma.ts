import "dotenv/config";
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@genprisma/client'
import {env} from './env.js'

const isProduction = env.NODE_ENV === 'production'
const connectionString = isProduction ? env.DATABASE_URL : env.LOCAL_DB_URL

const adapter = new PrismaPg({ connectionString })
const prisma = new PrismaClient({ adapter })

export { prisma }
