import { prisma, zeroDataStore } from "./prismaClient.js";

// ZERO DUMMY DATA MANDATE:
// Database initializes in a pure, zero-data state.
// No dummy mock projects, no hardcoded pricing lists, no fake survey logs.
export const memoryStore = zeroDataStore;

export default { prisma, memoryStore };
