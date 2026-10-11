import dotenv from "dotenv";
import { PrismaClient } from "@prisma/client";

dotenv.config();

let prisma = null;
let isPrismaConnected = false;

try {
  prisma = new PrismaClient();
  isPrismaConnected = true;
} catch (e) {
  console.warn("⚠️ Prisma client initialization deferred:", e.message);
  isPrismaConnected = false;
}

// ZERO DUMMY DATA MANDATE:
// Database initializes in a pure, zero-data state.
export const memoryStore = {
  users: [],
  user_sessions: [],
  projects: [],
  quotations: [],
  field_surveys: [],
  survey_media: [],
  audit_logs: [],
  stage_approval_tat: []
};

export { prisma, isPrismaConnected };
export default { prisma, memoryStore, isPrismaConnected };

