import crypto from "crypto";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const INVENTORY_FILE = path.join(__dirname, "inventory_store.json");
const PROJECTS_FILE = path.join(__dirname, "projects_store.json");
const CATALOG_FILE = path.join(__dirname, "catalog_store.json");

// Default Tier-1 Equipment Seeds
export const SEED_SOLAR_PANELS = [
  {
    id: "pnl-jinko-585-001",
    manufacturer: "Jinko Solar",
    modelName: "Tiger Neo JKM585N-72HL4-BDV 585W",
    wattage: 585,
    efficiency: 22.65,
    lengthMm: 2278,
    widthMm: 1134,
    thicknessMm: 30,
    weightKg: 28.5,
    voc: 51.5,
    vmp: 43.2,
    isc: 14.36,
    imp: 13.54,
    tempCoeffPmax: -0.0030,
    tempCoeffVoc: -0.0028,
    warrantyYears: 25,
    pricePerUnit: 17550,
    isDefault: true,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z")
  },
  {
    id: "pnl-longi-600-002",
    manufacturer: "Longi Solar",
    modelName: "Hi-MO 7 LR5-72HGD-600M",
    wattage: 600,
    efficiency: 23.23,
    lengthMm: 2278,
    widthMm: 1134,
    thicknessMm: 30,
    weightKg: 31.8,
    voc: 52.1,
    vmp: 43.8,
    isc: 14.58,
    imp: 13.70,
    tempCoeffPmax: -0.0028,
    tempCoeffVoc: -0.0026,
    warrantyYears: 25,
    pricePerUnit: 18600,
    isDefault: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z")
  },
  {
    id: "pnl-jasolar-620-003",
    manufacturer: "JA Solar",
    modelName: "DeepBlue 4.0 Pro JAM72D40-620/GB",
    wattage: 620,
    efficiency: 23.00,
    lengthMm: 2465,
    widthMm: 1134,
    thicknessMm: 35,
    weightKg: 31.1,
    voc: 55.4,
    vmp: 46.2,
    isc: 14.15,
    imp: 13.42,
    tempCoeffPmax: -0.0030,
    tempCoeffVoc: -0.0026,
    warrantyYears: 25,
    pricePerUnit: 19840,
    isDefault: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z")
  },
  {
    id: "pnl-canadian-700-004",
    manufacturer: "Canadian Solar",
    modelName: "HiKu7 CS7N-700MS Mono PERC",
    wattage: 700,
    efficiency: 22.53,
    lengthMm: 2384,
    widthMm: 1303,
    thicknessMm: 35,
    weightKg: 37.8,
    voc: 46.5,
    vmp: 39.1,
    isc: 19.00,
    imp: 17.90,
    tempCoeffPmax: -0.0034,
    tempCoeffVoc: -0.0026,
    warrantyYears: 25,
    pricePerUnit: 23100,
    isDefault: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z")
  },
  {
    id: "pnl-trina-605-005",
    manufacturer: "Trina Solar",
    modelName: "Vertex N NEG19RC.20 605W",
    wattage: 605,
    efficiency: 22.40,
    lengthMm: 2382,
    widthMm: 1134,
    thicknessMm: 30,
    weightKg: 33.7,
    voc: 47.9,
    vmp: 40.2,
    isc: 16.02,
    imp: 15.05,
    tempCoeffPmax: -0.0030,
    tempCoeffVoc: -0.0024,
    warrantyYears: 25,
    pricePerUnit: 18755,
    isDefault: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z")
  }
];

export const SEED_INVERTERS = [
  {
    id: "inv-huawei-20k-001",
    manufacturer: "Huawei",
    modelName: "SUN2000-20KTL-M2 Three-Phase",
    type: "string",
    ratedAcOutputKw: 20.0,
    maxDcInputVoltage: 1080.0,
    mpptRangeMin: 160.0,
    mpptRangeMax: 950.0,
    numberOfMpptInputs: 2,
    maxInputCurrentPerMppt: 22.0,
    efficiencyPct: 98.65,
    warrantyYears: 5,
    pricePerUnit: 395000,
    isDefault: true,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z")
  },
  {
    id: "inv-huawei-50k-002",
    manufacturer: "Huawei",
    modelName: "SUN2000-50KTL-M3 Commercial",
    type: "string",
    ratedAcOutputKw: 50.0,
    maxDcInputVoltage: 1100.0,
    mpptRangeMin: 200.0,
    mpptRangeMax: 1000.0,
    numberOfMpptInputs: 4,
    maxInputCurrentPerMppt: 30.0,
    efficiencyPct: 98.70,
    warrantyYears: 5,
    pricePerUnit: 720000,
    isDefault: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z")
  },
  {
    id: "inv-sungrow-20k-003",
    manufacturer: "Sungrow",
    modelName: "SG20RT Multi-MPPT String",
    type: "string",
    ratedAcOutputKw: 20.0,
    maxDcInputVoltage: 1100.0,
    mpptRangeMin: 160.0,
    mpptRangeMax: 1000.0,
    numberOfMpptInputs: 2,
    maxInputCurrentPerMppt: 25.0,
    efficiencyPct: 98.50,
    warrantyYears: 5,
    pricePerUnit: 380000,
    isDefault: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z")
  },
  {
    id: "inv-sungrow-100k-004",
    manufacturer: "Sungrow",
    modelName: "SG100CX Commercial 100kW",
    type: "string",
    ratedAcOutputKw: 100.0,
    maxDcInputVoltage: 1100.0,
    mpptRangeMin: 200.0,
    mpptRangeMax: 1000.0,
    numberOfMpptInputs: 12,
    maxInputCurrentPerMppt: 30.0,
    efficiencyPct: 98.80,
    warrantyYears: 5,
    pricePerUnit: 1150000,
    isDefault: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z")
  },
  {
    id: "inv-knox-6k2-005",
    manufacturer: "Knox",
    modelName: "Krypton 6.2kW Hybrid On/Off Grid",
    type: "hybrid",
    ratedAcOutputKw: 6.2,
    maxDcInputVoltage: 500.0,
    mpptRangeMin: 90.0,
    mpptRangeMax: 450.0,
    numberOfMpptInputs: 1,
    maxInputCurrentPerMppt: 27.0,
    efficiencyPct: 97.50,
    warrantyYears: 5,
    pricePerUnit: 195000,
    isDefault: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z")
  },
  {
    id: "inv-goodwe-15k-006",
    manufacturer: "GoodWe",
    modelName: "GW15K-ET Three-Phase Hybrid Storage",
    type: "hybrid",
    ratedAcOutputKw: 15.0,
    maxDcInputVoltage: 1000.0,
    mpptRangeMin: 200.0,
    mpptRangeMax: 850.0,
    numberOfMpptInputs: 2,
    maxInputCurrentPerMppt: 30.0,
    efficiencyPct: 98.20,
    warrantyYears: 5,
    pricePerUnit: 460000,
    isDefault: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z")
  },
  {
    id: "inv-solis-25k-007",
    manufacturer: "Ginlong Solis",
    modelName: "S5-GC25K Three-Phase 25kW",
    type: "string",
    ratedAcOutputKw: 25.0,
    maxDcInputVoltage: 1100.0,
    mpptRangeMin: 200.0,
    mpptRangeMax: 1000.0,
    numberOfMpptInputs: 3,
    maxInputCurrentPerMppt: 32.0,
    efficiencyPct: 98.70,
    warrantyYears: 5,
    pricePerUnit: 420000,
    isDefault: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z")
  }
];

export const SEED_RACKING_SYSTEMS = [
  {
    id: "rck-l1-standard-001",
    name: "L1 Standard Flush Rooftop Mount",
    type: "rooftop",
    tiltRangeMin: 5,
    tiltRangeMax: 15,
    material: "Anodized Aluminum AL6005-T5",
    windRatingKmh: 140,
    pricePerKwp: 4500,
    isDefault: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z")
  },
  {
    id: "rck-l2-elevated-002",
    name: "L2 Elevated Rooftop Mount (HDG)",
    type: "elevated",
    tiltRangeMin: 10,
    tiltRangeMax: 30,
    material: "Hot-Dip Galvanized HDG (80µm)",
    windRatingKmh: 160,
    pricePerKwp: 7500,
    isDefault: true,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z")
  },
  {
    id: "rck-l3-highrise-003",
    name: "L3 Super-Elevated Walkable Terrace Structure",
    type: "elevated",
    tiltRangeMin: 12,
    tiltRangeMax: 25,
    material: "Heavy-Gauge HDG C-Channel / I-Beam",
    windRatingKmh: 180,
    pricePerKwp: 11500,
    isDefault: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z")
  },
  {
    id: "rck-ground-mount-004",
    name: "Ground-Mount Rammed Piling System",
    type: "ground-mount",
    tiltRangeMin: 15,
    tiltRangeMax: 35,
    material: "HDG Carbon Steel Q235B",
    windRatingKmh: 170,
    pricePerKwp: 6200,
    isDefault: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z")
  },
  {
    id: "rck-carport-005",
    name: "Dual-Bay Solar Carport Structure",
    type: "carport",
    tiltRangeMin: 5,
    tiltRangeMax: 10,
    material: "Waterproof HDG Structural Steel",
    windRatingKmh: 150,
    pricePerKwp: 14000,
    isDefault: false,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z")
  }
];

// In-Memory Data Store strictly honoring the schema with permanent Super-Admin seed
export const zeroDataStore = {
  users: [
    {
      id: "usr-super-admin-001",
      fullName: "Super Admin (GreenTech)",
      email: "admin@greentech.pk",
      passwordHash: "$2a$10$fMXVEybfqPRpPzVq01d27uECQcCDEKCgpBvEHa/7WzQWoX3/yJVh.", // Password123!
      role: "SUPER_ADMIN",
      designation: "Chief Executive Officer (CEO)",
      isApproved: true,
      canLockProposals: true,
      avatarUrl: null,
      createdAt: new Date("2026-01-01T00:00:00Z")
    }
  ],
  userSessions: [],
  projects: [],
  siteSurveys: [],
  quotations: [],
  auditLogs: [],
  solarPanels: [],
  inverters: [],
  rackingSystems: [],
  solarDesigns: [],
  securitySettings: {
    approvalPassword: "Password123!",
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    updatedBy: "usr-super-admin-001"
  },
  companyProfile: {
    id: "comp-greentech-001",
    companyName: "Green Tech Power",
    registrationNtn: "7845129-3",
    licenseCategory: "PEC C3 / Specialized Solar Energy EPC",
    officialEmail: "info@greentechpower.pk",
    phone: "+92 42 35789100",
    headOfficeAddress: "Green Tech Towers, Main Boulevard, Gulberg III, Lahore, Pakistan",
    logoUrl: "/assets/greentech-logo.svg",
    updatedAt: new Date("2026-01-01T00:00:00Z")
  },
  inventory: [],
  systemStockAllocations: [],
  inventoryAuditLogs: [],
  purchasingReceipts: []
};

// Persistence functions for inventory data
export const saveInventoryStore = () => {
  try {
    const data = {
      inventory: zeroDataStore.inventory || [],
      systemStockAllocations: zeroDataStore.systemStockAllocations || [],
      inventoryAuditLogs: zeroDataStore.inventoryAuditLogs || [],
      purchasingReceipts: zeroDataStore.purchasingReceipts || []
    };
    fs.writeFileSync(INVENTORY_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist inventory store:", err.message);
  }
};

export const loadInventoryStore = () => {
  try {
    if (fs.existsSync(INVENTORY_FILE)) {
      const raw = fs.readFileSync(INVENTORY_FILE, "utf-8");
      const data = JSON.parse(raw);
      zeroDataStore.inventory = data.inventory || [];
      zeroDataStore.systemStockAllocations = data.systemStockAllocations || [];
      zeroDataStore.inventoryAuditLogs = data.inventoryAuditLogs || [];
      zeroDataStore.purchasingReceipts = data.purchasingReceipts || [];
    } else {
      zeroDataStore.inventory = [];
      zeroDataStore.systemStockAllocations = [];
      zeroDataStore.inventoryAuditLogs = [];
      zeroDataStore.purchasingReceipts = [];
      saveInventoryStore();
    }
  } catch (err) {
    console.error("Failed to load inventory store:", err.message);
    zeroDataStore.inventory = [];
    zeroDataStore.systemStockAllocations = [];
    zeroDataStore.inventoryAuditLogs = [];
    zeroDataStore.purchasingReceipts = [];
  }
};

// Persistence functions for projects, proposals, security settings & users
export const saveProjectsStore = () => {
  try {
    const data = {
      projects: zeroDataStore.projects || [],
      siteSurveys: zeroDataStore.siteSurveys || [],
      quotations: zeroDataStore.quotations || [],
      auditLogs: (zeroDataStore.auditLogs || []).slice(0, 500),
      users: zeroDataStore.users || [],
      securitySettings: zeroDataStore.securitySettings || {
        approvalPassword: "Password123!",
        updatedAt: new Date(),
        updatedBy: "usr-super-admin-001"
      }
    };
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist projects store:", err.message);
  }
};

export const loadProjectsStore = () => {
  try {
    if (fs.existsSync(PROJECTS_FILE)) {
      const raw = fs.readFileSync(PROJECTS_FILE, "utf-8");
      const data = JSON.parse(raw);
      if (Array.isArray(data.projects)) zeroDataStore.projects = data.projects;
      if (Array.isArray(data.siteSurveys)) zeroDataStore.siteSurveys = data.siteSurveys;
      if (Array.isArray(data.quotations)) zeroDataStore.quotations = data.quotations;
      if (Array.isArray(data.auditLogs)) zeroDataStore.auditLogs = data.auditLogs;
      if (Array.isArray(data.users) && data.users.length > 0) {
        const hasAdmin = data.users.some(u => u.role === "SUPER_ADMIN");
        if (!hasAdmin) {
          data.users.unshift(zeroDataStore.users[0]);
        }
        zeroDataStore.users = data.users.map(u => ({
          ...u,
          canLockProposals: u.role === "SUPER_ADMIN" ? true : (u.canLockProposals === true)
        }));
      }
      if (data.securitySettings && data.securitySettings.approvalPassword) {
        zeroDataStore.securitySettings = data.securitySettings;
      }
    }
  } catch (err) {
    console.error("Failed to load projects store:", err.message);
  }
};

// Persistence functions for solar equipment catalog and solar design models
export const saveCatalogStore = () => {
  try {
    const data = {
      solarPanels: zeroDataStore.solarPanels || [],
      inverters: zeroDataStore.inverters || [],
      rackingSystems: zeroDataStore.rackingSystems || [],
      solarDesigns: zeroDataStore.solarDesigns || []
    };
    fs.writeFileSync(CATALOG_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("Failed to persist catalog store:", err.message);
  }
};

export const loadCatalogStore = () => {
  try {
    if (fs.existsSync(CATALOG_FILE)) {
      const raw = fs.readFileSync(CATALOG_FILE, "utf-8");
      const data = JSON.parse(raw);
      zeroDataStore.solarPanels = Array.isArray(data.solarPanels) && data.solarPanels.length > 0 ? data.solarPanels : [...SEED_SOLAR_PANELS];
      zeroDataStore.inverters = Array.isArray(data.inverters) && data.inverters.length > 0 ? data.inverters : [...SEED_INVERTERS];
      zeroDataStore.rackingSystems = Array.isArray(data.rackingSystems) && data.rackingSystems.length > 0 ? data.rackingSystems : [...SEED_RACKING_SYSTEMS];
      zeroDataStore.solarDesigns = Array.isArray(data.solarDesigns) ? data.solarDesigns : [];
    } else {
      zeroDataStore.solarPanels = [...SEED_SOLAR_PANELS];
      zeroDataStore.inverters = [...SEED_INVERTERS];
      zeroDataStore.rackingSystems = [...SEED_RACKING_SYSTEMS];
      zeroDataStore.solarDesigns = [];
      saveCatalogStore();
    }
  } catch (err) {
    console.error("Failed to load catalog store:", err.message);
    zeroDataStore.solarPanels = [...SEED_SOLAR_PANELS];
    zeroDataStore.inverters = [...SEED_INVERTERS];
    zeroDataStore.rackingSystems = [...SEED_RACKING_SYSTEMS];
    zeroDataStore.solarDesigns = [];
  }
};

// Initialize from disk if available
loadInventoryStore();
loadProjectsStore();
loadCatalogStore();

// Database Access Adapter providing exact Prisma API syntax
export class PrismaDataClient {
  constructor() {
    this.store = zeroDataStore;
  }

  // User Model
  user = {
    findUnique: async ({ where }) => {
      if (where.id) return this.store.users.find(u => u.id === where.id) || null;
      if (where.email) return this.store.users.find(u => u.email.toLowerCase() === where.email.toLowerCase()) || null;
      return null;
    },
    findMany: async (args = {}) => {
      let list = [...this.store.users];
      if (args.where) {
        if (args.where.role) list = list.filter(u => u.role === args.where.role);
        if (args.where.isApproved !== undefined) list = list.filter(u => u.isApproved === args.where.isApproved);
      }
      return list;
    },
    create: async ({ data }) => {
      const newUser = {
        id: crypto.randomUUID(),
        fullName: data.fullName,
        email: data.email.toLowerCase(),
        passwordHash: data.passwordHash,
        role: data.role || "SURVEY_ENGINEER",
        designation: data.designation || data.position || (data.role === "SUPER_ADMIN" ? "Chief Executive Officer (CEO)" : "Solar Engineer"),
        isApproved: data.isApproved !== undefined ? data.isApproved : false,
        canLockProposals: data.canLockProposals !== undefined ? !!data.canLockProposals : (data.role === "SUPER_ADMIN"),
        avatarUrl: data.avatarUrl || null,
        createdAt: new Date()
      };
      this.store.users.push(newUser);
      saveProjectsStore();
      return newUser;
    },
    update: async ({ where, data }) => {
      const idx = this.store.users.findIndex(u => u.id === where.id);
      if (idx === -1) throw new Error("User not found");
      this.store.users[idx] = { ...this.store.users[idx], ...data };
      saveProjectsStore();
      return this.store.users[idx];
    },
    delete: async ({ where }) => {
      const idx = this.store.users.findIndex(u => u.id === where.id);
      if (idx === -1) throw new Error("User not found");
      const removed = this.store.users.splice(idx, 1)[0];
      saveProjectsStore();
      return removed;
    },
    count: async () => this.store.users.length
  };

  // UserSession Model
  userSession = {
    create: async ({ data }) => {
      const newSession = {
        id: crypto.randomUUID(),
        userId: data.userId,
        loginTimestamp: data.loginTimestamp || new Date(),
        logoutTimestamp: null,
        sessionDurationMinutes: null,
        ipAddress: data.ipAddress || "127.0.0.1"
      };
      this.store.userSessions.unshift(newSession);
      return newSession;
    },
    update: async ({ where, data }) => {
      const session = this.store.userSessions.find(s => s.id === where.id);
      if (session) {
        Object.assign(session, data);
        return session;
      }
      return null;
    },
    findFirst: async ({ where }) => {
      if (where.userId) {
        return this.store.userSessions.find(s => s.userId === where.userId && !s.logoutTimestamp) || null;
      }
      return null;
    },
    findMany: async ({ where, include, orderBy, take } = {}) => {
      let list = [...this.store.userSessions];
      if (where?.userId) list = list.filter(s => s.userId === where.userId);
      return list.map(s => ({
        ...s,
        user: this.store.users.find(u => u.id === s.userId) || null
      }));
    }
  };

  // Project Model
  project = {
    create: async ({ data }) => {
      const contractPrice = parseFloat(data.contractPricePkr) || 0;
      const estimatedCost = parseFloat(data.estimatedCostPkr) || 0;
      const netProfit = data.netProfitPkr !== undefined ? parseFloat(data.netProfitPkr) : (contractPrice - estimatedCost);

      const newProject = {
        id: crypto.randomUUID(),
        projectCode: data.projectCode,
        clientName: data.clientName,
        clientCnic: data.clientCnic || null,
        siteAddress: data.siteAddress,
        subDivision: data.subDivision || null,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        systemCapacityKw: parseFloat(data.systemCapacityKw) || 0,
        contractPricePkr: contractPrice,
        estimatedCostPkr: estimatedCost,
        netProfitPkr: netProfit,
        dealCloseDate: data.dealCloseDate ? new Date(data.dealCloseDate) : new Date(),
        targetDeliveryDate: data.targetDeliveryDate ? new Date(data.targetDeliveryDate) : null,
        projectDetails: data.projectDetails || null,
        status: data.status || "ONBOARDED",
        createdAt: new Date(),
        updatedAt: new Date(),
        surveyUploadedAt: data.surveyUploadedAt || null,
        boqSubmittedAt: data.boqSubmittedAt || null,
        adminApprovedAt: data.adminApprovedAt || null,
        siteCompletedAt: data.siteCompletedAt || null,
        completionYear: data.completionYear || null,
        createdBy: data.createdBy || null,
        approvedBy: data.approvedBy || null,
        financialModel: data.financialModel || null
      };
      this.store.projects.unshift(newProject);
      saveProjectsStore();
      return newProject;
    },
    findUnique: async ({ where, include }) => {
      const proj = this.store.projects.find(p => p.id === where.id || p.projectCode === where.projectCode);
      if (!proj) return null;
      const res = { ...proj };
      if (include?.surveyData) {
        res.surveyData = this.store.siteSurveys.find(s => s.projectId === proj.id) || null;
      }
      if (include?.quotation) {
        res.quotation = this.store.quotations.find(q => q.projectId === proj.id) || null;
      }
      if (include?.creator) {
        res.creator = this.store.users.find(u => u.id === proj.createdBy) || null;
      }
      if (include?.approver) {
        res.approver = this.store.users.find(u => u.id === proj.approvedBy) || null;
      }
      if (include?.solarDesign) {
        res.solarDesign = (this.store.solarDesigns || []).find(d => d.projectId === proj.id) || null;
      }
      return res;
    },
    findMany: async (args = {}) => {
      return this.store.projects.map(proj => {
        const res = { ...proj };
        if (args.include?.surveyData) {
          res.surveyData = this.store.siteSurveys.find(s => s.projectId === proj.id) || null;
        }
        if (args.include?.quotation) {
          res.quotation = this.store.quotations.find(q => q.projectId === proj.id) || null;
        }
        if (args.include?.creator) {
          res.creator = this.store.users.find(u => u.id === proj.createdBy) || null;
        }
        if (args.include?.approver) {
          res.approver = this.store.users.find(u => u.id === proj.approvedBy) || null;
        }
        if (args.include?.solarDesign) {
          res.solarDesign = (this.store.solarDesigns || []).find(d => d.projectId === proj.id) || null;
        }
        return res;
      });
    },
    update: async ({ where, data }) => {
      const idx = this.store.projects.findIndex(p => p.id === where.id);
      if (idx === -1) throw new Error("Project not found");
      this.store.projects[idx] = { ...this.store.projects[idx], ...data };
      saveProjectsStore();
      return this.store.projects[idx];
    },
    delete: async ({ where }) => {
      const idx = this.store.projects.findIndex(p => p.id === where.id);
      if (idx === -1) throw new Error("Project not found");
      const removed = this.store.projects.splice(idx, 1)[0];
      saveProjectsStore();
      return removed;
    },
    count: async () => this.store.projects.length
  };

  // SiteSurvey Model
  siteSurvey = {
    create: async ({ data }) => {
      const newSurvey = {
        id: crypto.randomUUID(),
        projectId: data.projectId,
        panelBrand: data.panelBrand,
        panelModel: data.panelModel,
        panelWattage: parseInt(data.panelWattage),
        panelQuantity: parseInt(data.panelQuantity),
        inverterType: data.inverterType,
        inverterBrand: data.inverterBrand,
        inverterCapacityKw: parseFloat(data.inverterCapacityKw),
        structureType: data.structureType,
        frontHeightMm: data.frontHeightMm ? parseFloat(data.frontHeightMm) : null,
        backHeightMm: data.backHeightMm ? parseFloat(data.backHeightMm) : null,
        tiltAngle: data.tiltAngle ? parseFloat(data.tiltAngle) : null,
        azimuthDirection: data.azimuthDirection || "True South (180°)",
        batteryType: data.batteryType || null,
        batteryBrand: data.batteryBrand || null,
        cableBrand: data.cableBrand || "Fast Cables",
        cableSize: data.cableSize || "1x6mm²",
        cableLengthMeters: parseFloat(data.cableLengthMeters || 100),
        earthingJobPrice: parseFloat(data.earthingJobPrice || 120000),
        civilWorkPrice: parseFloat(data.civilWorkPrice || 85000),
        installationPrice: parseFloat(data.installationPrice || 150000),
        netMeteringPrice: parseFloat(data.netMeteringPrice || 75000),
        includeSld: data.includeSld !== undefined ? data.includeSld : true,
        roofPolygonJson: data.roofPolygonJson || [],
        aiSummaryText: data.aiSummaryText || null
      };
      
      const existingIdx = this.store.siteSurveys.findIndex(s => s.projectId === data.projectId);
      if (existingIdx !== -1) {
        this.store.siteSurveys[existingIdx] = newSurvey;
      } else {
        this.store.siteSurveys.push(newSurvey);
      }
      saveProjectsStore();
      return newSurvey;
    },
    findUnique: async ({ where }) => {
      if (where.id) return this.store.siteSurveys.find(s => s.id === where.id) || null;
      if (where.projectId) return this.store.siteSurveys.find(s => s.projectId === where.projectId) || null;
      return null;
    },
    update: async ({ where, data }) => {
      const survey = this.store.siteSurveys.find(s => s.id === where.id || s.projectId === where.projectId);
      if (!survey) throw new Error("Site survey not found");
      Object.assign(survey, data);
      saveProjectsStore();
      return survey;
    },
    upsert: async ({ where, update, create }) => {
      const existing = await this.siteSurvey.findUnique({ where });
      if (existing) {
        return this.siteSurvey.update({ where, data: update });
      } else {
        return this.siteSurvey.create({ data: create });
      }
    }
  };

  // Quotation Model
  quotation = {
    create: async ({ data }) => {
      const newQuote = {
        id: crypto.randomUUID(),
        projectId: data.projectId,
        systemCapacityKw: parseFloat(data.systemCapacityKw),
        internalCostPkr: parseFloat(data.internalCostPkr),
        clientSellingPkr: parseFloat(data.clientSellingPkr),
        marginPkr: parseFloat(data.marginPkr),
        isLocked: !!data.isLocked,
        signedAt: data.signedAt || null
      };

      const existingIdx = this.store.quotations.findIndex(q => q.projectId === data.projectId);
      if (existingIdx !== -1) {
        this.store.quotations[existingIdx] = newQuote;
      } else {
        this.store.quotations.push(newQuote);
      }
      saveProjectsStore();
      return newQuote;
    },
    findUnique: async ({ where }) => {
      if (where.id) return this.store.quotations.find(q => q.id === where.id) || null;
      if (where.projectId) return this.store.quotations.find(q => q.projectId === where.projectId) || null;
      return null;
    },
    findFirst: async ({ where }) => {
      if (where.id) return this.store.quotations.find(q => q.id === where.id) || null;
      if (where.projectId) return this.store.quotations.find(q => q.projectId === where.projectId) || null;
      return null;
    },
    update: async ({ where, data }) => {
      const quote = this.store.quotations.find(q => q.id === where.id || q.projectId === where.projectId);
      if (!quote) throw new Error("Quotation not found");
      Object.assign(quote, data);
      saveProjectsStore();
      return quote;
    }
  };

  // Company Profile Model (Dynamic company branding & setup)
  companyProfile = {
    get: async () => this.store.companyProfile,
    upsert: async (data) => {
      this.store.companyProfile = {
        id: this.store.companyProfile?.id || crypto.randomUUID(),
        companyName: data.companyName || "Solar EPC Enterprise",
        registrationNtn: data.registrationNtn || "",
        licenseCategory: data.licenseCategory || "PEC C3 / Specialized Solar",
        officialEmail: data.officialEmail || "",
        phone: data.phone || "",
        headOfficeAddress: data.headOfficeAddress || "",
        logoUrl: data.logoUrl || "",
        updatedAt: new Date()
      };
      return this.store.companyProfile;
    }
  };

  // Inventory Model (Warehouse Stock & Hardware Catalog)
  inventory = {
    findMany: async (args = {}) => {
      let list = [...this.store.inventory];
      if (args.where?.category) {
        list = list.filter(i => i.category.toLowerCase() === args.where.category.toLowerCase());
      }
      if (args.where?.warehouse) {
        list = list.filter(i => i.warehouse.toLowerCase().includes(args.where.warehouse.toLowerCase()));
      }
      return list;
    },
    findUnique: async ({ where }) => {
      if (where.id) return this.store.inventory.find(i => i.id === where.id) || null;
      if (where.sku) return this.store.inventory.find(i => i.sku.toLowerCase() === where.sku.toLowerCase()) || null;
      return null;
    },
    create: async ({ data }) => {
      const total = parseInt(data.totalStock) || 0;
      const allocated = parseInt(data.allocatedStock) || 0;
      const threshold = parseInt(data.minThreshold) || 10;
      const avail = total - allocated;

      const newItem = {
        id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        sku: data.sku,
        name: data.name,
        category: data.category || "PANELS",
        brand: data.brand || "Solar EPC",
        model: data.model || "",
        unit: data.unit || "Units",
        totalStock: total,
        allocatedStock: allocated,
        minThreshold: threshold,
        unitCostPkr: parseFloat(data.unitCostPkr) || 0,
        warehouse: data.warehouse || "Central Hub (Karachi Port)",
        status: avail <= 0 ? "OUT_OF_STOCK" : (total <= threshold ? "LOW_STOCK" : "IN_STOCK"),
        specs: data.specs || "",
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.store.inventory.unshift(newItem);
      saveInventoryStore();
      return newItem;
    },
    update: async ({ where, data }) => {
      const idx = this.store.inventory.findIndex(i => i.id === where.id || (where.sku && i.sku.toLowerCase() === where.sku.toLowerCase()));
      if (idx === -1) throw new Error("Inventory item not found");
      const current = this.store.inventory[idx];
      const updated = { ...current, ...data, updatedAt: new Date() };
      
      const total = updated.totalStock !== undefined ? parseInt(updated.totalStock) : current.totalStock;
      const allocated = updated.allocatedStock !== undefined ? parseInt(updated.allocatedStock) : current.allocatedStock;
      const threshold = updated.minThreshold !== undefined ? parseInt(updated.minThreshold) : current.minThreshold;
      const avail = total - allocated;

      updated.totalStock = total;
      updated.allocatedStock = allocated;
      updated.minThreshold = threshold;
      updated.status = avail <= 0 ? "OUT_OF_STOCK" : (total <= threshold ? "LOW_STOCK" : "IN_STOCK");
      
      this.store.inventory[idx] = updated;
      saveInventoryStore();
      return updated;
    },
    adjustStock: async ({ id, sku, changeAmount, newTotal }) => {
      const idx = this.store.inventory.findIndex(i => (id && i.id === id) || (sku && i.sku.toLowerCase() === sku.toLowerCase()));
      if (idx === -1) throw new Error("Inventory item not found");
      const current = this.store.inventory[idx];
      let total = current.totalStock;
      if (newTotal !== undefined && newTotal !== null) {
        total = Math.max(0, parseInt(newTotal));
      } else if (changeAmount !== undefined && changeAmount !== null) {
        total = Math.max(0, total + parseInt(changeAmount));
      }
      const allocated = current.allocatedStock || 0;
      const avail = total - allocated;
      const threshold = current.minThreshold || 10;
      const updated = {
        ...current,
        totalStock: total,
        status: avail <= 0 ? "OUT_OF_STOCK" : (total <= threshold ? "LOW_STOCK" : "IN_STOCK"),
        updatedAt: new Date()
      };
      this.store.inventory[idx] = updated;
      saveInventoryStore();
      return { updated, previousTotal: current.totalStock, change: total - current.totalStock };
    },
    delete: async ({ where }) => {
      const idx = this.store.inventory.findIndex(i => i.id === where.id);
      if (idx === -1) throw new Error("Inventory item not found");
      const removed = this.store.inventory.splice(idx, 1)[0];
      saveInventoryStore();
      return removed;
    },
    clearAll: async () => {
      this.store.inventory = [];
      this.store.systemStockAllocations = [];
      this.store.inventoryAuditLogs = [];
      this.store.purchasingReceipts = [];
      saveInventoryStore();
      return { success: true };
    }
  };

  // System Stock Allocation Model (Stock reserved & dispatched per project system)
  systemStockAllocation = {
    findMany: async (args = {}) => {
      let list = [...this.store.systemStockAllocations];
      if (args.where?.projectId) {
        list = list.filter(a => a.projectId === args.where.projectId);
      }
      return list;
    },
    findUnique: async ({ where }) => {
      if (where.id) return this.store.systemStockAllocations.find(a => a.id === where.id) || null;
      if (where.projectId) return this.store.systemStockAllocations.find(a => a.projectId === where.projectId) || null;
      return null;
    },
    create: async ({ data }) => {
      const newAllocation = {
        id: `alloc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        projectId: data.projectId,
        projectCode: data.projectCode || "",
        items: data.items || [], // [{ sku, name, quantity, unit, warehouse }]
        status: data.status || "RESERVED", // RESERVED, DISPATCHED, DELIVERED, RELEASED
        chalanNumber: data.chalanNumber || `MIN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        driverName: data.driverName || null,
        vehicleNo: data.vehicleNo || null,
        driverPhone: data.driverPhone || null,
        allocatedBy: data.allocatedBy || "Authorized Solar Engineer",
        allocatedAt: new Date(),
        dispatchedAt: data.dispatchedAt || null,
        notes: data.notes || ""
      };

      // Also increment allocatedStock on the matched inventory items
      for (const reqItem of (data.items || [])) {
        const inv = this.store.inventory.find(i => i.sku.toLowerCase() === reqItem.sku?.toLowerCase());
        if (inv) {
          inv.allocatedStock = (inv.allocatedStock || 0) + (parseInt(reqItem.quantity) || 0);
          const avail = inv.totalStock - inv.allocatedStock;
          inv.status = avail <= 0 ? "OUT_OF_STOCK" : (inv.totalStock <= inv.minThreshold ? "LOW_STOCK" : "IN_STOCK");
        }
      }

      this.store.systemStockAllocations.unshift(newAllocation);
      saveInventoryStore();
      return newAllocation;
    },
    addItemAllocation: async ({ projectId, projectCode, clientName, item, user }) => {
      const qty = parseInt(item.quantity) || 0;
      if (qty <= 0) throw new Error("Quantity must be greater than 0");

      // Match inventory item
      const inv = this.store.inventory.find(i => i.sku.toLowerCase() === item.sku?.toLowerCase());
      if (!inv) throw new Error(`SKU ${item.sku} not found in Warehouse Master`);

      const avail = (inv.totalStock || 0) - (inv.allocatedStock || 0);
      if (avail < qty) {
        throw new Error(`Insufficient warehouse stock for ${item.sku}. Available: ${avail}, Requested: ${qty}`);
      }

      // Increment allocatedStock in warehouse
      inv.allocatedStock = (inv.allocatedStock || 0) + qty;
      const newAvail = inv.totalStock - inv.allocatedStock;
      inv.status = newAvail <= 0 ? "OUT_OF_STOCK" : (inv.totalStock <= inv.minThreshold ? "LOW_STOCK" : "IN_STOCK");

      // Find or create allocation record for projectId
      let alloc = this.store.systemStockAllocations.find(a => a.projectId === projectId && a.status === "RESERVED");
      if (!alloc) {
        alloc = {
          id: `alloc-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          projectId,
          projectCode: projectCode || "",
          clientName: clientName || "",
          items: [],
          status: "RESERVED",
          chalanNumber: `MIN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
          allocatedBy: user?.fullName || "Authorized Staff",
          allocatedAt: new Date(),
          notes: item.notes || `Stock allocated by ${user?.fullName || "Staff"}`
        };
        this.store.systemStockAllocations.unshift(alloc);
      }

      const existingItemIdx = alloc.items.findIndex(i => i.sku?.toLowerCase() === item.sku?.toLowerCase());
      if (existingItemIdx !== -1) {
        alloc.items[existingItemIdx].quantity = (parseInt(alloc.items[existingItemIdx].quantity) || 0) + qty;
      } else {
        alloc.items.push({
          inventoryId: inv.id,
          sku: inv.sku,
          name: inv.name,
          category: inv.category,
          quantity: qty,
          unit: inv.unit || "Units",
          warehouse: inv.warehouse,
          unitCostPkr: inv.unitCostPkr || 0
        });
      }

      saveInventoryStore();
      return { allocation: alloc, inventoryItem: inv, allocatedQty: qty, remainingWarehouseAvail: newAvail };
    },
    returnItemAllocation: async ({ projectId, sku, quantity, user, notes }) => {
      const qty = parseInt(quantity) || 0;
      if (qty <= 0) throw new Error("Quantity to return must be greater than 0");

      const alloc = this.store.systemStockAllocations.find(a => a.projectId === projectId && (a.status === "RESERVED" || a.status === "DISPATCHED"));
      if (!alloc) throw new Error("No active allocation found for this project");

      const itemIdx = alloc.items.findIndex(i => i.sku?.toLowerCase() === sku?.toLowerCase());
      if (itemIdx === -1) throw new Error(`Item ${sku} is not allocated to this project`);

      const currentAllocatedQty = parseInt(alloc.items[itemIdx].quantity) || 0;
      const actualReturnQty = Math.min(currentAllocatedQty, qty);

      if (currentAllocatedQty <= actualReturnQty) {
        alloc.items.splice(itemIdx, 1);
      } else {
        alloc.items[itemIdx].quantity = currentAllocatedQty - actualReturnQty;
      }

      // Restore warehouse available stock by decreasing allocatedStock
      const inv = this.store.inventory.find(i => i.sku?.toLowerCase() === sku?.toLowerCase());
      if (inv) {
        inv.allocatedStock = Math.max(0, (inv.allocatedStock || 0) - actualReturnQty);
        const newAvail = inv.totalStock - inv.allocatedStock;
        inv.status = newAvail <= 0 ? "OUT_OF_STOCK" : (inv.totalStock <= inv.minThreshold ? "LOW_STOCK" : "IN_STOCK");
      }

      saveInventoryStore();
      return {
        success: true,
        returnedQty: actualReturnQty,
        remainingInSystem: alloc.items.find(i => i.sku?.toLowerCase() === sku?.toLowerCase())?.quantity || 0,
        warehouseStock: inv ? (inv.totalStock - inv.allocatedStock) : 0,
        inventoryItem: inv
      };
    },
    update: async ({ where, data }) => {
      const idx = this.store.systemStockAllocations.findIndex(a => a.id === where.id || (where.projectId && a.projectId === where.projectId));
      if (idx === -1) throw new Error("Allocation record not found");
      const current = this.store.systemStockAllocations[idx];
      const updated = { ...current, ...data, updatedAt: new Date() };
      this.store.systemStockAllocations[idx] = updated;
      saveInventoryStore();
      return updated;
    },
    release: async ({ projectId }) => {
      const alloc = this.store.systemStockAllocations.find(a => a.projectId === projectId && a.status === "RESERVED");
      if (alloc) {
        // Rollback allocatedStock in inventory
        for (const itm of (alloc.items || [])) {
          const inv = this.store.inventory.find(i => i.sku.toLowerCase() === itm.sku?.toLowerCase());
          if (inv) {
            inv.allocatedStock = Math.max(0, (inv.allocatedStock || 0) - (parseInt(itm.quantity) || 0));
            const avail = inv.totalStock - inv.allocatedStock;
            inv.status = avail <= 0 ? "OUT_OF_STOCK" : (inv.totalStock <= inv.minThreshold ? "LOW_STOCK" : "IN_STOCK");
          }
        }
        alloc.status = "RELEASED";
        alloc.releasedAt = new Date();
        saveInventoryStore();
        return alloc;
      }
      return null;
    }
  };

  // Purchasing & Goods Receipt Note (GRN) Model
  purchasingReceipt = {
    findMany: async ({ where } = {}) => {
      let list = [...(this.store.purchasingReceipts || [])];
      if (where) {
        if (where.targetStream && where.targetStream !== "ALL") {
          list = list.filter(p => p.targetStream === where.targetStream);
        }
        if (where.projectId) {
          list = list.filter(p => p.projectId === where.projectId);
        }
        if (where.verificationStatus && where.verificationStatus !== "ALL") {
          list = list.filter(p => p.verificationStatus === where.verificationStatus);
        }
      }
      return list.sort((a, b) => new Date(b.exactTimestamp || b.createdAt) - new Date(a.exactTimestamp || a.createdAt));
    },
    findUnique: async ({ where }) => {
      return (this.store.purchasingReceipts || []).find(p => p.id === where.id) || null;
    },
    create: async ({ data }) => {
      const receipt = {
        id: `prc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        createdAt: new Date().toISOString(),
        status: "COMPLETED",
        verificationStatus: "PENDING_AUDIT",
        ...data
      };
      if (!this.store.purchasingReceipts) this.store.purchasingReceipts = [];
      this.store.purchasingReceipts.unshift(receipt);
      saveInventoryStore();
      return receipt;
    },
    update: async ({ where, data }) => {
      const idx = (this.store.purchasingReceipts || []).findIndex(p => p.id === where.id);
      if (idx === -1) throw new Error("Purchasing receipt not found");
      this.store.purchasingReceipts[idx] = {
        ...this.store.purchasingReceipts[idx],
        ...data,
        updatedAt: new Date().toISOString()
      };
      saveInventoryStore();
      return this.store.purchasingReceipts[idx];
    },
    delete: async ({ where }) => {
      const idx = (this.store.purchasingReceipts || []).findIndex(p => p.id === where.id);
      if (idx === -1) throw new Error("Purchasing receipt not found");
      const removed = this.store.purchasingReceipts.splice(idx, 1)[0];
      saveInventoryStore();
      return removed;
    }
  };

  // SolarPanel Model
  solarPanel = {
    findMany: async ({ where } = {}) => {
      let list = [...(this.store.solarPanels || [])];
      if (where) {
        if (where.manufacturer) {
          list = list.filter(p => p.manufacturer?.toLowerCase().includes(where.manufacturer.toLowerCase()));
        }
        if (where.search) {
          const s = where.search.toLowerCase();
          list = list.filter(p => p.manufacturer?.toLowerCase().includes(s) || p.modelName?.toLowerCase().includes(s));
        }
        if (where.minWattage) {
          list = list.filter(p => p.wattage >= Number(where.minWattage));
        }
        if (where.maxWattage) {
          list = list.filter(p => p.wattage <= Number(where.maxWattage));
        }
      }
      return list.sort((a, b) => (b.wattage || 0) - (a.wattage || 0));
    },
    findUnique: async ({ where }) => {
      return (this.store.solarPanels || []).find(p => p.id === where.id || p.modelName === where.modelName) || null;
    },
    create: async ({ data }) => {
      const panel = {
        id: `pnl-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        manufacturer: data.manufacturer || "Generic",
        modelName: data.modelName,
        wattage: parseInt(data.wattage) || 585,
        efficiency: parseFloat(data.efficiency) || 21.5,
        lengthMm: parseInt(data.lengthMm) || 2278,
        widthMm: parseInt(data.widthMm) || 1134,
        thicknessMm: parseInt(data.thicknessMm) || 30,
        weightKg: parseFloat(data.weightKg) || 28.5,
        voc: parseFloat(data.voc) || 51.5,
        vmp: parseFloat(data.vmp) || 43.2,
        isc: parseFloat(data.isc) || 14.36,
        imp: parseFloat(data.imp) || 13.54,
        tempCoeffPmax: parseFloat(data.tempCoeffPmax) || -0.0030,
        tempCoeffVoc: parseFloat(data.tempCoeffVoc) || -0.0028,
        warrantyYears: parseInt(data.warrantyYears) || 25,
        pricePerUnit: parseFloat(data.pricePerUnit) || 0,
        isDefault: !!data.isDefault,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      if (!this.store.solarPanels) this.store.solarPanels = [];
      this.store.solarPanels.push(panel);
      saveCatalogStore();
      return panel;
    },
    update: async ({ where, data }) => {
      const idx = (this.store.solarPanels || []).findIndex(p => p.id === where.id || p.modelName === where.modelName);
      if (idx === -1) throw new Error("Solar panel not found");
      this.store.solarPanels[idx] = {
        ...this.store.solarPanels[idx],
        ...data,
        updatedAt: new Date()
      };
      saveCatalogStore();
      return this.store.solarPanels[idx];
    },
    delete: async ({ where }) => {
      const idx = (this.store.solarPanels || []).findIndex(p => p.id === where.id || p.modelName === where.modelName);
      if (idx === -1) throw new Error("Solar panel not found");
      const removed = this.store.solarPanels.splice(idx, 1)[0];
      saveCatalogStore();
      return removed;
    }
  };

  // Inverter Model
  inverter = {
    findMany: async ({ where } = {}) => {
      let list = [...(this.store.inverters || [])];
      if (where) {
        if (where.manufacturer) {
          list = list.filter(i => i.manufacturer?.toLowerCase().includes(where.manufacturer.toLowerCase()));
        }
        if (where.type) {
          list = list.filter(i => i.type?.toLowerCase() === where.type.toLowerCase());
        }
        if (where.search) {
          const s = where.search.toLowerCase();
          list = list.filter(i => i.manufacturer?.toLowerCase().includes(s) || i.modelName?.toLowerCase().includes(s));
        }
        if (where.minKw) {
          list = list.filter(i => i.ratedAcOutputKw >= Number(where.minKw));
        }
      }
      return list.sort((a, b) => (b.ratedAcOutputKw || 0) - (a.ratedAcOutputKw || 0));
    },
    findUnique: async ({ where }) => {
      return (this.store.inverters || []).find(i => i.id === where.id || i.modelName === where.modelName) || null;
    },
    create: async ({ data }) => {
      const inv = {
        id: `inv-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        manufacturer: data.manufacturer || "Generic",
        modelName: data.modelName,
        type: data.type || "string",
        ratedAcOutputKw: parseFloat(data.ratedAcOutputKw) || 20.0,
        maxDcInputVoltage: parseFloat(data.maxDcInputVoltage) || 1100.0,
        mpptRangeMin: parseFloat(data.mpptRangeMin) || 160.0,
        mpptRangeMax: parseFloat(data.mpptRangeMax) || 1000.0,
        numberOfMpptInputs: parseInt(data.numberOfMpptInputs) || 2,
        maxInputCurrentPerMppt: parseFloat(data.maxInputCurrentPerMppt) || 25.0,
        efficiencyPct: parseFloat(data.efficiencyPct) || 98.5,
        warrantyYears: parseInt(data.warrantyYears) || 5,
        pricePerUnit: parseFloat(data.pricePerUnit) || 0,
        isDefault: !!data.isDefault,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      if (!this.store.inverters) this.store.inverters = [];
      this.store.inverters.push(inv);
      saveCatalogStore();
      return inv;
    },
    update: async ({ where, data }) => {
      const idx = (this.store.inverters || []).findIndex(i => i.id === where.id || i.modelName === where.modelName);
      if (idx === -1) throw new Error("Inverter not found");
      this.store.inverters[idx] = {
        ...this.store.inverters[idx],
        ...data,
        updatedAt: new Date()
      };
      saveCatalogStore();
      return this.store.inverters[idx];
    },
    delete: async ({ where }) => {
      const idx = (this.store.inverters || []).findIndex(i => i.id === where.id || i.modelName === where.modelName);
      if (idx === -1) throw new Error("Inverter not found");
      const removed = this.store.inverters.splice(idx, 1)[0];
      saveCatalogStore();
      return removed;
    }
  };

  // RackingSystem Model
  rackingSystem = {
    findMany: async ({ where } = {}) => {
      let list = [...(this.store.rackingSystems || [])];
      if (where?.type) {
        list = list.filter(r => r.type?.toLowerCase() === where.type.toLowerCase());
      }
      if (where?.search) {
        const s = where.search.toLowerCase();
        list = list.filter(r => r.name?.toLowerCase().includes(s) || r.material?.toLowerCase().includes(s));
      }
      return list;
    },
    findUnique: async ({ where }) => {
      return (this.store.rackingSystems || []).find(r => r.id === where.id || r.name === where.name) || null;
    },
    create: async ({ data }) => {
      const racking = {
        id: `rck-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        name: data.name,
        type: data.type || "rooftop",
        tiltRangeMin: parseFloat(data.tiltRangeMin) || 5.0,
        tiltRangeMax: parseFloat(data.tiltRangeMax) || 35.0,
        material: data.material || "Hot-Dip Galvanized HDG (80µm)",
        windRatingKmh: parseFloat(data.windRatingKmh) || 150.0,
        pricePerKwp: parseFloat(data.pricePerKwp) || 0,
        isDefault: !!data.isDefault,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      if (!this.store.rackingSystems) this.store.rackingSystems = [];
      this.store.rackingSystems.push(racking);
      saveCatalogStore();
      return racking;
    },
    update: async ({ where, data }) => {
      const idx = (this.store.rackingSystems || []).findIndex(r => r.id === where.id);
      if (idx === -1) throw new Error("Racking system not found");
      this.store.rackingSystems[idx] = {
        ...this.store.rackingSystems[idx],
        ...data,
        updatedAt: new Date()
      };
      saveCatalogStore();
      return this.store.rackingSystems[idx];
    },
    delete: async ({ where }) => {
      const idx = (this.store.rackingSystems || []).findIndex(r => r.id === where.id);
      if (idx === -1) throw new Error("Racking system not found");
      const removed = this.store.rackingSystems.splice(idx, 1)[0];
      saveCatalogStore();
      return removed;
    }
  };

  // SolarDesign Model
  solarDesign = {
    findUnique: async ({ where }) => {
      return (this.store.solarDesigns || []).find(d => (where.projectId && d.projectId === where.projectId) || (where.id && d.id === where.id)) || null;
    },
    create: async ({ data }) => {
      const design = {
        id: `dsg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        ...data,
        projectId: data.projectId,
        siteAddress: data.siteAddress || null,
        latitude: data.latitude ? parseFloat(data.latitude) : null,
        longitude: data.longitude ? parseFloat(data.longitude) : null,
        roofType: data.roofType || "RCC Flat",
        usableAreaSqM: data.usableAreaSqM ? parseFloat(data.usableAreaSqM) : null,
        gridConnectionType: data.gridConnectionType || "3-Phase 400V Net-Metering",
        satelliteImageUrl: data.satelliteImageUrl || null,
        totalSystemKw: parseFloat(data.totalSystemKw) || 0,
        totalModuleCount: parseInt(data.totalModuleCount) || 0,
        estimatedAnnualKwh: parseFloat(data.estimatedAnnualKwh) || 0,
        performanceRatio: parseFloat(data.performanceRatio) || 81.5,
        arrays: data.arrays || [],
        obstructions: data.obstructions || [],
        electricalConfig: data.electricalConfig || null,
        lossTree: data.lossTree || null,
        sldData: data.sldData || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      if (!this.store.solarDesigns) this.store.solarDesigns = [];
      this.store.solarDesigns.push(design);
      saveCatalogStore();
      return design;
    },
    update: async ({ where, data }) => {
      const idx = (this.store.solarDesigns || []).findIndex(d => (where.projectId && d.projectId === where.projectId) || (where.id && d.id === where.id));
      if (idx === -1) throw new Error("Solar design not found");
      this.store.solarDesigns[idx] = {
        ...this.store.solarDesigns[idx],
        ...data,
        updatedAt: new Date()
      };
      saveCatalogStore();
      return this.store.solarDesigns[idx];
    },
    upsert: async ({ where, update, create }) => {
      const existing = (this.store.solarDesigns || []).find(d => (where.projectId && d.projectId === where.projectId) || (where.id && d.id === where.id));
      if (existing) {
        return this.solarDesign.update({ where, data: update });
      } else {
        return this.solarDesign.create({ data: { ...create, projectId: where.projectId || create.projectId } });
      }
    }
  };
}

export const prisma = new PrismaDataClient();
export default prisma;

