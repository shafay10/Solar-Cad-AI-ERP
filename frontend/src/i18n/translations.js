// Comprehensive Multi-Language Dictionary for Solar ERP Platform
// Supported Languages: English (en), Urdu (ur), Spanish (es), German (de), Russian (ru)

export const LANGUAGES = [
  { id: "en", name: "English", nativeName: "English", flag: "🇬🇧", dir: "ltr" },
  { id: "ur", name: "Urdu", nativeName: "اردو", flag: "🇵🇰", dir: "rtl" },
  { id: "es", name: "Spanish", nativeName: "Español", flag: "🇪🇸", dir: "ltr" },
  { id: "de", name: "German", nativeName: "Deutsch", flag: "🇩🇪", dir: "ltr" },
  { id: "ru", name: "Russian", nativeName: "Русский", flag: "🇷🇺", dir: "ltr" }
];

export const TRANSLATIONS = {
  en: {
    // Top Navigation
    nav: {
      projects: "All Projects",
      boq: "BOQ (PKR)",
      inventory: "Inventory & Stock",
      proposal: "Quotation / Proposal (PDF)",
      cad: "HelioScope CAD",
      survey: "Field Survey",
      financial: "25Y Yield",
      admin: "Super-Admin",
      audit: "Audit & Seal",
      liveErp: "Live ERP",
      noActiveProjects: "No Active Projects",
      createNewProject: "Create New Project",
      companyProfile: "Company Profile & Branding",
      changeColorTheme: "Change Color Theme",
      lightSaaS: "Light SaaS",
      cyberDark: "Cyber Dark",
      softMint: "Soft Mint",
      impersonationNotice: "Super-Admin Impersonation",
      exitImpersonation: "Exit Impersonation",
      selectLanguage: "Language",
      switchLanguage: "Change Language"
    },

    // AutoCAD Single Line Diagram (SLD) Inspection & Architecture (From Screenshot)
    sld: {
      title: "AutoCAD Single Line Diagram (SLD) Architecture",
      subtitle: "Full electrical schematics, string configurations, DISCO net-metering compliance, and component specifications",
      downloadDxf: "Download AutoCAD (.DXF)",
      viewGuide: "AutoCAD SLD Guide",
      discoSdoChecklist: "DISCO SDO CHECKLIST",
      standardLabel: "Standard",
      componentSpecs: "Component Specifications",
      components: {
        pv_array: {
          name: "PV Module Array (DC Source)",
          subtitle: "Solar Strings & DC Voltage",
          category: "DC Generation",
          specs: "Tier-1 N-Type TOPCon / Bifacial Half-Cell modules wired in series-parallel strings with multi-contact MC4 waterproof connectors.",
          discoChecklist: "String open-circuit voltage (Voc) verification (must not exceed 1000V DC inverter limit), polarity test, and PID anti-degradation inspection."
        },
        dc_isolator: {
          name: "DC Disconnect & Type II SPD",
          subtitle: "DC Isolator & Surge Protection",
          category: "DC Protection",
          specs: "Schneider / Suntree enclosed IP66 DC isolator box with optical arc flash barriers and dedicated surge path to chemical grounding pit.",
          discoChecklist: "Rotary lockable manual isolator within arm's reach of inverter, class II DC surge arrestor, and no-load switching compliance."
        },
        inverter: {
          name: "Grid-Tied / Hybrid Solar Inverter",
          subtitle: "DC to AC Power Conversion & Synchronization",
          category: "Power Conversion & Synchronization",
          specs: "Multi-MPPT string inverter with integrated smart meter communication, dual RS485/WiFi telemetry, and zero-export control relay.",
          discoChecklist: "Anti-Islanding trip test (< 100ms disconnection when WAPDA power cuts off), power factor >= 0.95, and AFCI arc detection."
        },
        ac_mccb: {
          name: "AC Distribution Box & 4-Pole MCCB",
          subtitle: "AC Protection & Grid Isolation",
          category: "AC Protection & Isolation",
          specs: "Industrial Grade IP65 panel with Schneider/ABB MCCB breaker, calibrated thermal-magnetic trip, and digital AC multi-function metering.",
          discoChecklist: "4-pole isolation disconnecting all 3 phases and neutral, Type II AC surge arrestor, and residual current protection (RCD 300mA)."
        },
        bi_directional_meter: {
          name: "DISCO Bi-Directional Net-Meter",
          subtitle: "Green Meter (Import / Export Grid Credit)",
          category: "Utility Grid Interconnection",
          specs: "MicroTech / Apex 3-phase four-quadrant bidirectional green meter recording exported kWh credit against consumed grid units.",
          discoChecklist: "DISCO lab calibration test stamp, sealed optical communication port, peak/off-peak bidirectional register verification."
        },
        earth_pit: {
          name: "Chemical Earth Pit & Lightning Protection",
          subtitle: "System Grounding (< 2.5 Ω Resistance)",
          category: "System Grounding",
          specs: "10-foot pure electrolytic copper bonded rod encased in low-resistivity bentonite earth compound with inspection chamber pit.",
          discoChecklist: "Earth resistance digital Megger test certificate (< 2.5Ω required by LESCO/IESCO/KE), separate DC/AC earth pits."
        }
      }
    },

    // Inventory & Stock Management Module
    inventory: {
      title: "Inventory & Stock Management",
      subtitle: "Real-time warehouse equipment inventory & live stock allocation for each solar power system",
      tabs: {
        system: "Stock in Each System",
        warehouse: "Warehouse Master",
        purchasing: "Purchasing & Bills",
        audit: "Stock Movement & Audit Log"
      },
      kpis: {
        totalAssetValue: "Total Asset Value",
        availableInWarehouse: "Available in Warehouse",
        allocatedToSystems: "Allocated to Systems",
        lowStockAlerts: "Low Stock Alerts",
        unitsM: "Units/m",
        skus: "SKUs"
      },
      systemAllocation: {
        selectProject: "Select System / Project:",
        statusReady: "System Stock 100% Ready",
        statusPartial: "Partial Stock in Hubs",
        statusDeficit: "Stock Shortage",
        allocateStock: "Allocate Stock to System",
        purchaseForSystem: "Purchase for System (Upload Bills & Photos)",
        reserveAllBoq: "Reserve All BOQ Stock",
        dispatchGatePass: "Dispatch & Gate Pass",
        releaseAll: "Release All",
        feasibilityTitle: "Equipment Stock Feasibility",
        tableHeaders: {
          component: "Component / Equipment",
          skuWarehouse: "SKU & Warehouse",
          required: "Required for System",
          allocated: "Allocated to System",
          remainingNeeded: "Remaining Needed",
          remainingWarehouse: "Remaining in Warehouse",
          unitCost: "Unit Cost (PKR)",
          status: "Status",
          actions: "Actions"
        }
      },
      purchasingVault: {
        title: "Purchasing, Invoices & Materials Vault",
        superAdminVaultBadge: "Super Admin Vault (Full Financials)",
        purchasingDeptBadge: "Purchasing Dept Intake Portal",
        superAdminSubtitle: "Exclusive ledger: Audit supplier invoices, physical delivery photos, Day/Date/Year/Time PKT timestamps, and approve incoming stock.",
        purchasingDeptSubtitle: "Goods intake portal: Record vendor purchases with mandatory material photos & bills to increment warehouse or system inventory.",
        recordNewPurchase: "Record New Purchase",
        inwardWarehouse: "+ Warehouse Hub",
        inwardSystem: "+ System Stock",
        inwardCommercial: "+ Commercial Mega",
        policyActiveSuperAdmin: "Super Admin Executive Audit & Verification Active: You have unrestricted access to all vendor invoice scans, delivery photos, negotiated unit rates, and origin timestamps.",
        policyActiveStaff: "Confidential Procurement Security Policy Active: Vendor invoices, high-resolution bill proofs, and unit financial pricing are securely stored and viewable strictly by Super Admins.",
        kpis: {
          totalInwardValue: "Total Inward Value",
          totalInwardGrns: "Total Inward GRNs",
          superAdminVerified: "Super Admin Verified",
          pendingReview: "Pending Audit Review",
          bills: "Bills",
          pending: "Pending",
          consignments: "Inwards"
        },
        filters: {
          allStreams: "All Inward Streams (3 Channels)",
          warehouseMaster: "Central Warehouse Master",
          systemStock: "Stock in Each System",
          commercialProject: "Large Commercial Projects",
          allYears: "All Financial Years",
          allStatuses: "All Audit Statuses",
          verified: "Super Admin Verified",
          pendingAudit: "Pending Audit Review",
          searchPlaceholder: "Search receipt #, bill #, vendor ('where from'), city, day or date..."
        },
        cardLabels: {
          timeAndDayPkt: "Exact Time & Day (PKT)",
          vendorOrigin: "Vendor Origin ('Where From')",
          billAndInvoice: "Official Bill & Invoice",
          uploadedByDept: "Uploaded by Dept",
          inwardQuantity: "Inward Quantity",
          unitRate: "Unit Rate (PKR)",
          lineTotal: "Line Total (PKR)",
          batchSerial: "Batch / Serial",
          materialPhotos: "Physical Equipment Delivery Photos",
          billPhotos: "Official Vendor Bill / Invoices",
          verifiedPhysical: "Verified Physical Stock",
          securedInVault: "Secured in Super Admin Vault",
          confidentialNotice: "Vendor Bill Invoices Confidential: Uploaded invoices are securely archived for Super Admin audit.",
          verifyAndApprove: "Verify & Approve Bill"
        },
        modal: {
          title: "Goods Inward & Purchasing Record",
          mandatoryBadge: "Mandatory Photos & Bills",
          subtitle: "Enter supplier purchase details. Stock is added only when physical material photos AND official vendor bills are attached.",
          selectChannel: "Select Stock Inward Channel (3 Streams):",
          centralWarehouse: "Central Warehouse Hub",
          centralWarehouseDesc: "Master general storage",
          stockInEachSystem: "Stock in Each System",
          stockInEachSystemDesc: "Dedicated to project",
          largeCommercial: "Large Commercial Mega",
          largeCommercialDesc: "100kW - 1MW project site",
          vendorHeading: "Vendor Details & Location ('Where From')",
          livePktBadge: "Live PKT Timestamp Active",
          vendorName: "Vendor / Supplier Name",
          vendorLocation: "Vendor Location / City ('Where From')",
          vendorContact: "Vendor Contact / Phone",
          paymentMethod: "Payment Method",
          billInvoiceNo: "Official Bill / Invoice Number",
          poNumber: "PO Reference Number",
          purchasedItems: "Purchased Equipment Items & Inward Quantities:",
          addItemLine: "Add Item Line",
          mandatoryProofs: "Mandatory Inward Proofs (Physical Photos & Bills)",
          mandatoryProofsDesc: "Stock cannot be added without both physical equipment arrival photos and official vendor invoices.",
          attachSample: "Attach Sample Stamped Invoice & Photos",
          uploadMaterial: "1. Physical Equipment Photos",
          uploadMaterialDesc: "Upload photos of unloaded solar panels, inverters, cables, and packaging at depot or site.",
          uploadBills: "2. Official Vendor Bills / Invoices",
          uploadBillsDesc: "Upload stamped supplier invoices, GST bills, goods delivery challans, or custom clearance documents.",
          mandatoryNoticeMaterial: "⚠️ Mandatory: Material Photo Required",
          mandatoryNoticeBill: "⚠️ Mandatory: Vendor Bill Required",
          purchasingNotes: "Purchasing Notes / Inspection Remarks:",
          cancel: "Cancel",
          savePurchase: "Save Purchase & Add Stock"
        }
      }
    },

    // Common Actions
    common: {
      save: "Save",
      cancel: "Cancel",
      close: "Close",
      delete: "Delete",
      edit: "Edit",
      search: "Search",
      filter: "Filter",
      refresh: "Refresh",
      download: "Download",
      print: "Print",
      verified: "Verified",
      pending: "Pending",
      status: "Status",
      actions: "Actions",
      confidential: "Confidential",
      units: "Units",
      all: "All",
      yes: "Yes",
      no: "No",
      loading: "Loading..."
    }
  },

  ur: {
    // Top Navigation (اردو)
    nav: {
      projects: "تمام پروجیکٹس (پورٹ فولیو)",
      boq: "بی او کیو (روپے)",
      inventory: "انوینٹری اور اسٹاک",
      proposal: "کوٹیشن / پروپوزل (پی ڈی ایف)",
      cad: "ہیلیوسکوپ کیڈ",
      survey: "فیلڈ سروے",
      financial: "25 سالہ پیداوار",
      admin: "سپر ایڈمن",
      audit: "آڈٹ اور مہر",
      liveErp: "لائیو ای آر پی",
      noActiveProjects: "کوئی فعال پروجیکٹ نہیں",
      createNewProject: "نیا پروجیکٹ بنائیں",
      companyProfile: "کمپنی پروفائل اور برانڈنگ",
      changeColorTheme: "رنگین تھیم تبدیل کریں",
      lightSaaS: "لائٹ ساس",
      cyberDark: "سائبر ڈارک",
      softMint: "سافٹ منٹ",
      impersonationNotice: "سپر ایڈمن نقالی",
      exitImpersonation: "نقالی سے نکلیں",
      selectLanguage: "زبان",
      switchLanguage: "زبان تبدیل کریں"
    },

    // AutoCAD Single Line Diagram (SLD) Inspection & Architecture
    sld: {
      title: "آٹوکیڈ سنگل لائن ڈایاگرام (SLD) آرکیٹیکچر",
      subtitle: "مکمل الیکٹریکل اسکیماٹکس، سٹرنگ کنفیگریشنز، ڈسکو نیٹ میٹرنگ کمپلائنس اور کمپوننٹ تفصیلات",
      downloadDxf: "آٹوکیڈ فائل ڈاؤنلوڈ (.DXF)",
      viewGuide: "آٹوکیڈ SLD گائیڈ",
      discoSdoChecklist: "ڈسکو SDO چیک لسٹ",
      standardLabel: "معیار",
      componentSpecs: "کمپوننٹ کی خصوصیات",
      components: {
        pv_array: {
          name: "سولر پینل ارے (ڈی سی سورس)",
          subtitle: "سولر پینلز سٹرنگز اور وولٹیج",
          category: "ڈی سی جنریشن",
          specs: "ٹیر-1 این-ٹائپ ٹاپ کون / بائی فیشل ہاف سیل ماڈیولز سیریز پیرلل سٹرنگز میں واٹر پروف MC4 کنیکٹرز کے ساتھ۔",
          discoChecklist: "اوپن سرکٹ وولٹیج (Voc) کی تصدیق (1000V DC انورٹر حد سے زیادہ نہ ہو)، پولیرٹی ٹیسٹ اور PID معائنہ۔"
        },
        dc_isolator: {
          name: "ڈی سی ڈسکنیکٹ اور ٹائپ-II ایس پی ڈی",
          subtitle: "ڈی سی آئسولیٹر اور سرج پروٹیکشن",
          category: "ڈی سی پروٹیکشن",
          specs: "شنائیڈر / سن ٹری انکلوژر IP66 ڈی سی آئسولیٹر باکس مع آپٹیکل آرک فلیش بیریئرز اور ارتھ پٹ پروٹیکشن۔",
          discoChecklist: "روٹری لاک ایبل مینوئل آئسولیٹر انورٹر کے قریب، کلاس II ڈی سی سرج اریسر اور نو لوڈ سوئچنگ تعمیل۔"
        },
        inverter: {
          name: "گرڈ ٹائیڈ / ہائبرڈ سولر انورٹر",
          subtitle: "انورٹر (ڈی سی سے اے سی کنورژن)",
          category: "پاور کنورژن اور سنکرونائزیشن",
          specs: "ملٹی-ایم پی پی ٹی سٹرنگ انورٹر بمعہ سمارٹ میٹر کمیونیکیشن، ڈوئل RS485/WiFi ٹیلی میٹری اور زیرو ایکسپورٹ ریلے۔",
          discoChecklist: "اینٹی آئی لینڈنگ ٹرپ ٹیسٹ (واپڈا بند ہونے پر 100 ملی سیکنڈ میں کٹ آف)، پاور فیکٹر >= 0.95، اور AFCI آرک ڈیٹیکشن۔"
        },
        ac_mccb: {
          name: "اے سی ڈسٹری بیوشن باکس اور 4-پول بریکر",
          subtitle: "اے سی پروٹیکشن اور گرڈ آئسولیشن",
          category: "اے سی پروٹیکشن",
          specs: "انڈسٹریل گریڈ IP65 پینل مع شنائیڈر/اے بی بی MCCB بریکر، کیلیبریٹڈ تھرمل میگنیٹک ٹرپ اور ڈیجیٹل میٹرنگ۔",
          discoChecklist: "4-پول آئسولیشن تینوں فیزز اور نیوٹرل کی کٹوتی، ٹائپ II اے سی سرج اریسر اور RCD 300mA لیکیج پروٹیکشن۔"
        },
        bi_directional_meter: {
          name: "ڈسکو بائی ڈائریکشنل نیٹ میٹر",
          subtitle: "نیٹ میٹرنگ گرین میٹر (امپورٹ / ایکسپورٹ)",
          category: "یوٹیلٹی گرڈ کنکشن",
          specs: "مائیکروٹیک / ایپکس 3-فیز فور کواڈرنٹ گرین میٹر جو ایکسپورٹڈ یونٹس اور امپورٹڈ یونٹس کا خودکار حساب رکھتا ہے۔",
          discoChecklist: "ڈسکو لیب کیلیبریشن مہر، آپٹیکل پورٹ سیل، پیک اور آف پیک بائی ڈائریکشنل رجسٹر ویریفکیشن۔"
        },
        earth_pit: {
          name: "کیمیکل ارتھنگ پٹ اور لائٹننگ ارتھ",
          subtitle: "سسٹم گراؤنڈنگ (< 2.5 Ω مزاحمت)",
          category: "سسٹم گراؤنڈنگ",
          specs: "10 فٹ خالص الیکٹرولائٹک کاپر بانڈڈ راڈ بینٹونائیٹ کیمیکل کمپاؤنڈ میں مع انسپکشن چیمبر پٹ۔",
          discoChecklist: "ڈیجیٹل میگر ارتھ ٹیسٹ سرٹیفکیٹ (< 2.5Ω لیسکو/آئیسکو لازمی شرط)، الگ الگ ڈی سی اور اے سی پٹس۔"
        }
      }
    },

    // Inventory & Stock Management Module (اردو)
    inventory: {
      title: "انوینٹری اور اسٹاک مینجمنٹ",
      subtitle: "ویئر ہاؤس کے سامان کی لائیو انوینٹری اور ہر سولر سسٹم کے لیے حقیقی اسٹاک ایلوکیشن",
      tabs: {
        system: "ہر سسٹم کا الگ اسٹاک",
        warehouse: "مرکزی ویئر ہاؤس ماسٹر",
        purchasing: "پرچیزنگ و وینڈر بلز",
        audit: "اسٹاک موومنٹ و آڈٹ لاگ"
      },
      kpis: {
        totalAssetValue: "کل اثاثہ مالیت",
        availableInWarehouse: "ویئر ہاؤس میں دستیاب",
        allocatedToSystems: "سسٹمز میں الاٹ شدہ",
        lowStockAlerts: "کم اسٹاک الرٹس",
        unitsM: "یونٹس/میٹر",
        skus: "سامان لائنز"
      },
      systemAllocation: {
        selectProject: "سسٹم / پروجیکٹ منتخب کریں:",
        statusReady: "سسٹم اسٹاک 100% تیار",
        statusPartial: "کچھ سامان ہب میں موجود",
        statusDeficit: "اسٹاک کی کمی",
        allocateStock: "سسٹم کو اسٹاک الاٹ کریں",
        purchaseForSystem: "سسٹم کے لیے خریداری (تصاویر و بلز لازمی)",
        reserveAllBoq: "تمام BOQ سامان ریزرو کریں",
        dispatchGatePass: "ڈسپیچ اور گیٹ پاس",
        releaseAll: "سب ریلیز کریں",
        feasibilityTitle: "سامان اسٹاک فزیبلٹی",
        tableHeaders: {
          component: "کمپوننٹ / سامان",
          skuWarehouse: "SKU اور ویئر ہاؤس",
          required: "سسٹم کی ضرورت",
          allocated: "سسٹم کو الاٹ شدہ",
          remainingNeeded: "باقی درکار",
          remainingWarehouse: "ویئر ہاؤس میں موجود",
          unitCost: "یونٹ قیمت (روپے)",
          status: "اسٹیٹس",
          actions: "ایکشنز"
        }
      },
      purchasingVault: {
        title: "پرچیزنگ، انوائسز اور سامان والٹ",
        superAdminVaultBadge: "سپر ایڈمن والٹ (مکمل مالیاتی رسائی)",
        purchasingDeptBadge: "پرچیزنگ ڈیپارٹمنٹ انٹیک پورٹل",
        superAdminSubtitle: "خصوصی لیجر: سپلائر انوائسز، سامان کی تصاویر، دن/تاریخ/سال/وقت کے ٹائم اسٹیمپس اور اسٹاک کی منظوری۔",
        purchasingDeptSubtitle: "انٹیک پورٹل: وینڈر سے خریداری کی اصل تصاویر اور بلز اپلوڈ کر کے ویئر ہاؤس یا سسٹم میں اسٹاک داخل کریں۔",
        recordNewPurchase: "نئی خریداری درج کریں",
        inwardWarehouse: "+ ویئر ہاؤس ہب",
        inwardSystem: "+ سسٹم اسٹاک",
        inwardCommercial: "+ کمرشل میگا",
        policyActiveSuperAdmin: "سپر ایڈمن ایگزیکٹو آڈٹ فعال: آپ کو تمام بلز، تصاویر، یونٹ ریٹس اور تفصیلات تک مکمل رسائی حاصل ہے۔",
        policyActiveStaff: "خفیہ پریکیورمنٹ سیکیورٹی پالیسی: وینڈر بلز، انوائسز اور اصل ریٹس صرف سپر ایڈمنز دیکھ سکتے ہیں۔",
        kpis: {
          totalInwardValue: "کل خریداری مالیت",
          totalInwardGrns: "کل رسیدیں (GRNs)",
          superAdminVerified: "سپر ایڈمن سے تصدیق شدہ",
          pendingReview: "زیرِ جائزہ بلز",
          bills: "بلز",
          pending: "پینڈنگ",
          consignments: "رسیدیں"
        },
        filters: {
          allStreams: "تمام 3 چینلز (اسٹریمز)",
          warehouseMaster: "مرکزی ویئر ہاؤس ماسٹر",
          systemStock: "ہر سسٹم کا الگ اسٹاک",
          commercialProject: "بڑے کمرشل پروجیکٹس",
          allYears: "تمام مالیاتی سال",
          allStatuses: "تمام آڈٹ اسٹیٹس",
          verified: "سپر ایڈمن سے تصدیق شدہ",
          pendingAudit: "زیرِ آڈٹ جائزہ",
          searchPlaceholder: "رسید نمبر، بل نمبر، وینڈر ('کہاں سے خریدا')، شہر یا تاریخ تلاش کریں..."
        },
        cardLabels: {
          timeAndDayPkt: "صحیح وقت اور دن (PKT)",
          vendorOrigin: "وینڈر تفصیل ('کہاں سے خریدا')",
          billAndInvoice: "آفیشل بل و انوائس",
          uploadedByDept: "اپلوڈ کنندہ (ڈیپارٹمنٹ)",
          inwardQuantity: "انورڈ تعداد",
          unitRate: "یونٹ ریٹ (روپے)",
          lineTotal: "ٹوٹل (روپے)",
          batchSerial: "بیچ / سیریل",
          materialPhotos: "سامان کی اصل تصاویر (Delivery Photos)",
          billPhotos: "وینڈر بل / انوائسز کی تصاویر",
          verifiedPhysical: "تصدیق شدہ سامان",
          securedInVault: "سپر ایڈمن والٹ میں محفوظ",
          confidentialNotice: "وینڈر بل انوائسز خفیہ ہیں: پرچیزنگ ڈیپارٹمنٹ کی اپلوڈ کردہ انوائسز سپر ایڈمن کے لیے محفوظ ہیں۔",
          verifyAndApprove: "بل کی تصدیق و منظوری کریں"
        },
        modal: {
          title: "سامان انورڈ اور پرچیزنگ ریکارڈ",
          mandatoryBadge: "تصاویر اور بلز لازمی شرط",
          subtitle: "خریداری درج کریں۔ سامان تب ہی اسٹاک میں شامل ہوگا جب اصل تصاویر اور وینڈر بل دونوں موجود ہوں۔",
          selectChannel: "اسٹاک انورڈ چینل منتخب کریں (3 راستے):",
          centralWarehouse: "مرکزی ویئر ہاؤس ہب",
          centralWarehouseDesc: "جنرل ماسٹر اسٹوریج",
          stockInEachSystem: "ہر سسٹم کا الگ اسٹاک",
          stockInEachSystemDesc: "مخصوص پروجیکٹ کے لیے",
          largeCommercial: "بڑا کمرشل میگا پروجیکٹ",
          largeCommercialDesc: "100kW تا 1MW انڈسٹریل سائٹ",
          vendorHeading: "وینڈر کی تفصیل اور لوکیشن ('کہاں سے خریدا')",
          livePktBadge: "لائیو PKT ٹائم اسٹیمپ فعال",
          vendorName: "وینڈر / سپلائر کا نام",
          vendorLocation: "وینڈر لوکیشن / شہر ('کہاں سے')",
          vendorContact: "وینڈر فون نمبر / رابطہ",
          paymentMethod: "ادائیگی کا طریقہ",
          billInvoiceNo: "آفیشل بل / انوائس نمبر",
          poNumber: "پی او ریفرنس نمبر",
          purchasedItems: "خریدا گیا سامان اور تعداد:",
          addItemLine: "+ مزید سامان شامل کریں",
          mandatoryProofs: "لازمی ثبوت (سامان کی تصاویر اور وینڈر بل)",
          mandatoryProofsDesc: "دونوں تصاویر کے بغیر اسٹاک سسٹم میں شامل نہیں ہو سکتا۔",
          attachSample: "سیمپل اسٹیمپڈ انوائس اور تصاویر لگائیں",
          uploadMaterial: "1. سامان کی اصل تصاویر",
          uploadMaterialDesc: "ان لوڈ شدہ سولر پینلز، انورٹرز اور کیبلز کی تصاویر اپلوڈ کریں۔",
          uploadBills: "2. وینڈر بل / انوائس کی تصاویر",
          uploadBillsDesc: "وینڈر کی مہر شدہ انوائس، جی ایس ٹی بل یا ڈلیوری چالان کی تصویر اپلوڈ کریں۔",
          mandatoryNoticeMaterial: "⚠️ لازمی شرط: سامان کی تصویر ضروری ہے",
          mandatoryNoticeBill: "⚠️ لازمی شرط: وینڈر بل کی تصویر ضروری ہے",
          purchasingNotes: "پرچیزنگ و انسپکشن نوٹس:",
          cancel: "منسوخ کریں",
          savePurchase: "خریداری محفوظ اور اسٹاک شامل کریں"
        }
      }
    },

    // Common
    common: {
      save: "محفوظ کریں",
      cancel: "منسوخ کریں",
      close: "بند کریں",
      delete: "حذف کریں",
      edit: "ترمیم کریں",
      search: "تلاش کریں",
      filter: "فلٹر",
      refresh: "ریفریش",
      download: "ڈاؤنلوڈ",
      print: "پرنٹ کریں",
      verified: "تصدیق شدہ",
      pending: "پینڈنگ",
      status: "اسٹیٹس",
      actions: "ایکشنز",
      confidential: "خفیہ",
      units: "یونٹس",
      all: "تمام",
      yes: "ہاں",
      no: "نہیں",
      loading: "لوڈ ہو رہا ہے..."
    }
  },

  es: {
    // Top Navigation (Español)
    nav: {
      projects: "Todos los Proyectos",
      boq: "BOQ (PKR)",
      inventory: "Inventario y Stock",
      proposal: "Cotización / Propuesta (PDF)",
      cad: "CAD HelioScope",
      survey: "Inspección de Campo",
      financial: "Rendimiento 25A",
      admin: "Súper Admin",
      audit: "Auditoría y Sello",
      liveErp: "ERP en Vivo",
      noActiveProjects: "Sin Proyectos Activos",
      createNewProject: "Crear Nuevo Proyecto",
      companyProfile: "Perfil de Empresa",
      changeColorTheme: "Cambiar Tema",
      lightSaaS: "Luz SaaS",
      cyberDark: "Cyber Oscuro",
      softMint: "Menta Suave",
      impersonationNotice: "Suplantación de Súper Admin",
      exitImpersonation: "Salir de Suplantación",
      selectLanguage: "Idioma",
      switchLanguage: "Cambiar Idioma"
    },

    // AutoCAD Single Line Diagram (SLD) Inspection & Architecture
    sld: {
      title: "Arquitectura de Diagrama Unifilar (SLD) AutoCAD",
      subtitle: "Esquemas eléctricos completos, configuración de strings y especificaciones normativas",
      downloadDxf: "Descargar AutoCAD (.DXF)",
      viewGuide: "Guía AutoCAD SLD",
      discoSdoChecklist: "LISTA DE CONTROL DISCO SDO",
      standardLabel: "Norma",
      componentSpecs: "Especificaciones del Componente",
      components: {
        pv_array: {
          name: "Matriz de Módulos Fotovoltaicos (Fuente DC)",
          subtitle: "Strings Solares y Generación DC",
          category: "Generación DC",
          specs: "Módulos Tier-1 N-Type TOPCon / Bifaciales de media celda con conectores estancos MC4.",
          discoChecklist: "Verificación de Voc (< 1000V DC), prueba de polaridad e inspección anti-degradación PID."
        },
        dc_isolator: {
          name: "Seccionador DC y SPD Tipo II",
          subtitle: "Aislamiento DC y Protección contra Sobretensiones",
          category: "Protección DC",
          specs: "Caja estanca IP66 con barreras ópticas de arco y ruta a pozo de tierra química.",
          discoChecklist: "Seccionador manual bloqueable cerca del inversor, descargador de sobretensión Clase II."
        },
        inverter: {
          name: "Inversor Solar Híbrido / Conectado a Red",
          subtitle: "Conversión de Energía DC a AC y Sincronización",
          category: "Conversión y Sincronización",
          specs: "Inversor string multi-MPPT con telemetría dual RS485/WiFi y relé de inyección cero.",
          discoChecklist: "Prueba anti-isla (< 100ms desconexión), factor de potencia >= 0.95 y detección de arco AFCI."
        },
        ac_mccb: {
          name: "Cuadro de Distribución AC y MCCB de 4 Polos",
          subtitle: "Protección AC y Aislamiento de Red",
          category: "Protección AC",
          specs: "Panel industrial IP65 con disyuntor Schneider/ABB MCCB y medición multifunción digital.",
          discoChecklist: "Aislamiento de 4 polos desconectando las 3 fases y neutro, SPD Tipo II y diferencial RCD 300mA."
        },
        bi_directional_meter: {
          name: "Medidor Bidireccional DISCO (Net-Metering)",
          subtitle: "Medidor Verde (Crédito de Importación / Exportación)",
          category: "Interconexión a Red",
          specs: "Medidor trifásico de 4 cuadrantes que computa kWh exportados contra unidades de red consumidas.",
          discoChecklist: "Sello de calibración de laboratorio DISCO, puerto óptico sellado y verificación bidireccional."
        },
        earth_pit: {
          name: "Pozo de Tierra Química y Protección contra Rayos",
          subtitle: "Puesta a Tierra (< 2.5 Ω Resistencia)",
          category: "Puesta a Tierra",
          specs: "Varilla de cobre electrolítico de 10 pies envuelta en bentonita con cámara de inspección.",
          discoChecklist: "Certificado digital Megger de resistencia de tierra (< 2.5Ω requerido por DISCOs)."
        }
      }
    },

    // Inventory & Stock Management Module (Español)
    inventory: {
      title: "Gestión de Inventario y Stock",
      subtitle: "Inventario de almacén en tiempo real y asignación de stock para cada sistema solar",
      tabs: {
        system: "Stock en Cada Sistema",
        warehouse: "Almacén Central Master",
        purchasing: "Compras y Facturas",
        audit: "Movimientos y Auditoría"
      },
      kpis: {
        totalAssetValue: "Valor Total de Activos",
        availableInWarehouse: "Disponible en Almacén",
        allocatedToSystems: "Asignado a Sistemas",
        lowStockAlerts: "Alertas de Stock Bajo",
        unitsM: "Unidades/m",
        skus: "SKUs"
      },
      systemAllocation: {
        selectProject: "Seleccionar Sistema / Proyecto:",
        statusReady: "Stock de Sistema 100% Listo",
        statusPartial: "Stock Parcial en Hubs",
        statusDeficit: "Escasez de Stock",
        allocateStock: "Asignar Stock al Sistema",
        purchaseForSystem: "Comprar para Sistema (Subir Facturas y Fotos)",
        reserveAllBoq: "Reservar Todo el Stock BOQ",
        dispatchGatePass: "Despacho y Pase de Salida",
        releaseAll: "Liberar Todo",
        feasibilityTitle: "Viabilidad de Stock de Equipos",
        tableHeaders: {
          component: "Componente / Equipo",
          skuWarehouse: "SKU y Almacén",
          required: "Requerido por Sistema",
          allocated: "Asignado al Sistema",
          remainingNeeded: "Restante Necesario",
          remainingWarehouse: "Disponible en Almacén",
          unitCost: "Costo Unitario (PKR)",
          status: "Estado",
          actions: "Acciones"
        }
      },
      purchasingVault: {
        title: "Bóveda de Compras, Facturas y Materiales",
        superAdminVaultBadge: "Bóveda Súper Admin (Finanzas Completas)",
        purchasingDeptBadge: "Portal de Recepción de Compras",
        superAdminSubtitle: "Libro mayor exclusivo: Audite facturas de proveedores, fotos de entrega física y apruebe stock.",
        purchasingDeptSubtitle: "Portal de compras: Registre adquisiciones con fotos físicas y facturas obligatorias.",
        recordNewPurchase: "Registrar Nueva Compra",
        inwardWarehouse: "+ Almacén Central",
        inwardSystem: "+ Stock de Sistema",
        inwardCommercial: "+ Mega Comercial",
        policyActiveSuperAdmin: "Auditoría Ejecutiva de Súper Admin Activa: Acceso completo a facturas, fotos y precios unitarios.",
        policyActiveStaff: "Política de Confidencialidad Activa: Facturas y precios son accesibles exclusivamente por Súper Admins.",
        kpis: {
          totalInwardValue: "Valor Total Ingresado",
          totalInwardGrns: "Total Recepciones (GRNs)",
          superAdminVerified: "Verificado por Súper Admin",
          pendingReview: "Pendiente de Revisión",
          bills: "Facturas",
          pending: "Pendiente",
          consignments: "Recepciones"
        },
        filters: {
          allStreams: "Todas las Vías de Ingreso (3 Canales)",
          warehouseMaster: "Almacén Central Master",
          systemStock: "Stock en Cada Sistema",
          commercialProject: "Grandes Proyectos Comerciales",
          allYears: "Todos los Años",
          allStatuses: "Todos los Estados",
          verified: "Verificado por Súper Admin",
          pendingAudit: "Pendiente de Auditoría",
          searchPlaceholder: "Buscar recepción #, factura #, proveedor, ciudad o fecha..."
        },
        cardLabels: {
          timeAndDayPkt: "Fecha y Hora Exacta (PKT)",
          vendorOrigin: "Origen del Proveedor ('Dónde')",
          billAndInvoice: "Factura Oficial del Proveedor",
          uploadedByDept: "Subido por Depto.",
          inwardQuantity: "Cantidad Ingresada",
          unitRate: "Precio Unitario (PKR)",
          lineTotal: "Total (PKR)",
          batchSerial: "Lote / Serie",
          materialPhotos: "Fotos Físicas del Material",
          billPhotos: "Fotos de Facturas Oficiales",
          verifiedPhysical: "Stock Físico Verificado",
          securedInVault: "Protegido en Bóveda",
          confidentialNotice: "Facturas Confidenciales: Facturas archivadas para auditoría de Súper Admin.",
          verifyAndApprove: "Verificar y Aprobar Factura"
        },
        modal: {
          title: "Ingreso de Mercancía y Compra",
          mandatoryBadge: "Fotos y Facturas Obligatorias",
          subtitle: "Ingrese los datos de compra. El stock solo se agregará al adjuntar fotos físicas y facturas.",
          selectChannel: "Seleccione Canal de Ingreso:",
          centralWarehouse: "Almacén Central Master",
          centralWarehouseDesc: "Almacenamiento general",
          stockInEachSystem: "Stock en Cada Sistema",
          stockInEachSystemDesc: "Dedicado a proyecto específico",
          largeCommercial: "Mega Proyecto Comercial",
          largeCommercialDesc: "Sitio 100kW - 1MW",
          vendorHeading: "Detalles del Proveedor ('Dónde se compró')",
          livePktBadge: "Marca de Tiempo PKT Activa",
          vendorName: "Nombre del Proveedor",
          vendorLocation: "Ubicación / Ciudad del Proveedor",
          vendorContact: "Contacto / Teléfono",
          paymentMethod: "Método de Pago",
          billInvoiceNo: "Número de Factura Oficial",
          poNumber: "Número de Orden de Compra (PO)",
          purchasedItems: "Equipos y Cantidades Ingresadas:",
          addItemLine: "Agregar Línea de Equipo",
          mandatoryProofs: "Comprobantes Obligatorios (Fotos y Facturas)",
          mandatoryProofsDesc: "No se puede ingresar stock sin fotos físicas y factura del proveedor.",
          attachSample: "Adjuntar Factura y Fotos de Muestra",
          uploadMaterial: "1. Fotos Físicas del Equipo",
          uploadMaterialDesc: "Suba fotos de paneles, inversores y cables descargados.",
          uploadBills: "2. Fotos de Facturas Oficiales",
          uploadBillsDesc: "Suba la factura sellada del proveedor o remito oficial.",
          mandatoryNoticeMaterial: "⚠️ Obligatorio: Foto de material requerida",
          mandatoryNoticeBill: "⚠️ Obligatorio: Factura requerida",
          purchasingNotes: "Notas de Inspección / Compra:",
          cancel: "Cancelar",
          savePurchase: "Guardar Compra e Ingresar Stock"
        }
      }
    },

    common: {
      save: "Guardar",
      cancel: "Cancelar",
      close: "Cerrar",
      delete: "Eliminar",
      edit: "Editar",
      search: "Buscar",
      filter: "Filtrar",
      refresh: "Actualizar",
      download: "Descargar",
      print: "Imprimir",
      verified: "Verificado",
      pending: "Pendiente",
      status: "Estado",
      actions: "Acciones",
      confidential: "Confidencial",
      units: "Unidades",
      all: "Todos",
      yes: "Sí",
      no: "No",
      loading: "Cargando..."
    }
  },

  de: {
    // Top Navigation (Deutsch)
    nav: {
      projects: "Alle Projekte",
      boq: "Stückliste (PKR)",
      inventory: "Inventar & Lager",
      proposal: "Angebot / Vorschlag (PDF)",
      cad: "HelioScope CAD",
      survey: "Standortprüfung",
      financial: "25J Ertrag",
      admin: "Super-Admin",
      audit: "Prüfung & Siegel",
      liveErp: "Live-ERP",
      noActiveProjects: "Keine aktiven Projekte",
      createNewProject: "Neues Projekt anlegen",
      companyProfile: "Unternehmensprofil",
      changeColorTheme: "Farbschema ändern",
      lightSaaS: "Helles SaaS",
      cyberDark: "Cyber Dunkel",
      softMint: "Sanftes Mint",
      impersonationNotice: "Super-Admin Nachahmung",
      exitImpersonation: "Nachahmung beenden",
      selectLanguage: "Sprache",
      switchLanguage: "Sprache wechseln"
    },

    // AutoCAD Single Line Diagram (SLD) Inspection & Architecture
    sld: {
      title: "AutoCAD Einliniendiagramm (SLD) Architektur",
      subtitle: "Vollständige elektrische Schaltpläne, String-Konfigurationen und VDE-Standards",
      downloadDxf: "AutoCAD (.DXF) herunterladen",
      viewGuide: "AutoCAD SLD Anleitung",
      discoSdoChecklist: "DISCO SDO PRÜFLISTE",
      standardLabel: "Norm",
      componentSpecs: "Komponentenspezifikationen",
      components: {
        pv_array: {
          name: "PV-Modulfeld (DC-Quelle)",
          subtitle: "Solarstrings & DC-Erzeugung",
          category: "DC-Erzeugung",
          specs: "Tier-1 N-Type TOPCon / Bifaziale Halbzellenmodule mit MC4-Steckverbindern.",
          discoChecklist: "Überprüfung der Leerlaufspannung Voc (< 1000V DC), Polaritätstest und PID-Prüfung."
        },
        dc_isolator: {
          name: "DC-Trennschalter & Typ II Überspannungsschutz",
          subtitle: "DC-Trennung & Überspannungsableiter",
          category: "DC-Schutz",
          specs: "IP66 DC-Trennschalter mit optischen Lichtbogenbarrieren und Erdungsanschluss.",
          discoChecklist: "Verriegelbarer manueller Trennschalter nahe Wechselrichter, Typ II DC-Ableiter."
        },
        inverter: {
          name: "Netzgekoppelter / Hybrid-Solarwechselrichter",
          subtitle: "DC/AC-Leistungsumwandlung & Netzsynchronisation",
          category: "Leistungsumwandlung & Synchronisation",
          specs: "Multi-MPPT-Wechselrichter mit Smart-Meter-Kommunikation, RS485/WiFi und Null-Einspeiserelais.",
          discoChecklist: "Anti-Islanding-Abschaltung (< 100ms bei Netzausfall), Leistungsfaktor >= 0.95 und AFCI."
        },
        ac_mccb: {
          name: "AC-Verteilerkasten & 4-poliger MCCB-Leistungsschalter",
          subtitle: "AC-Schutz & Netztrennung",
          category: "AC-Schutz",
          specs: "IP65-Schaltschrank mit Schneider/ABB MCCB-Schalter und digitaler Multifunktionsmessung.",
          discoChecklist: "4-polige Trennung aller 3 Phasen und Neutralleiter, Typ II AC-Ableiter und RCD 300mA."
        },
        bi_directional_meter: {
          name: "Zweirichtungszähler (Net-Metering)",
          subtitle: "Grüner Zähler (Einspeisung / Bezug)",
          category: "Netzkopplung",
          specs: "Dreiphasiger 4-Quadranten-Zähler zur Verrechnung von eingespeistem Solarstrom mit Netzbezug.",
          discoChecklist: "Beglaubigungsstempel, versiegelter optischer Port und Prüfung beider Register."
        },
        earth_pit: {
          name: "Chemischer Erdungsschacht & Blitzschutz",
          subtitle: "Systemerdung (< 2.5 Ω Widerstand)",
          category: "Erdungssystem",
          specs: "Reinkupfer-Tiefenerder in Bentonit-Kompound mit Inspektionsschacht.",
          discoChecklist: "Digitales Erdungsmessprotokoll (< 2.5Ω Grenzwert), getrennte DC/AC-Erder."
        }
      }
    },

    inventory: {
      title: "Lagerbestand & Inventarverwaltung",
      subtitle: "Echtzeit-Lagerbestand und Live-Zuweisung für jede Solaranlage",
      tabs: {
        system: "Bestand pro System",
        warehouse: "Zentrallager Master",
        purchasing: "Einkauf & Rechnungen",
        audit: "Lagerbewegungen & Audit"
      },
      kpis: {
        totalAssetValue: "Gesamter Vermögenswert",
        availableInWarehouse: "Im Lager verfügbar",
        allocatedToSystems: "Systemen zugewiesen",
        lowStockAlerts: "Mindestbestand-Warnungen",
        unitsM: "Stk/m",
        skus: "Artikel"
      },
      systemAllocation: {
        selectProject: "System / Projekt wählen:",
        statusReady: "Systembestand 100% bereit",
        statusPartial: "Teilbestand im Lager",
        statusDeficit: "Fehlbestand",
        allocateStock: "Bestand zuweisen",
        purchaseForSystem: "Für System einkaufen (Fotos & Belege)",
        reserveAllBoq: "Gesamte Stückliste reservieren",
        dispatchGatePass: "Versand & Torschloss",
        releaseAll: "Alles freigeben",
        feasibilityTitle: "Geräte-Bestandsprüfung",
        tableHeaders: {
          component: "Komponente / Gerät",
          skuWarehouse: "Artikel & Lager",
          required: "Bedarf System",
          allocated: "Zugewiesen",
          remainingNeeded: "Restbedarf",
          remainingWarehouse: "Lagerbestand frei",
          unitCost: "Einzelpreis (PKR)",
          status: "Status",
          actions: "Aktionen"
        }
      },
      purchasingVault: {
        title: "Einkauf, Rechnungen & Warenannahme",
        superAdminVaultBadge: "Super-Admin Tresor (Finanzen)",
        purchasingDeptBadge: "Einkaufsabteilung Annahme",
        superAdminSubtitle: "Exklusives Hauptbuch: Lieferantenrechnungen, Warenfotos und Genehmigung eingehender Bestände.",
        purchasingDeptSubtitle: "Warenannahme: Einkäufe erfassen mit Pflichtfotos der Ware und Lieferantenrechnungen.",
        recordNewPurchase: "Neuen Einkauf buchen",
        inwardWarehouse: "+ Zentrallager",
        inwardSystem: "+ Systembestand",
        inwardCommercial: "+ Großprojekt Mega",
        policyActiveSuperAdmin: "Super-Admin Audit aktiv: Uneingeschränkter Zugriff auf alle Rechnungen, Fotos und Einkaufspreise.",
        policyActiveStaff: "Einkaufs-Geheimhaltung aktiv: Belege und Preise sind ausschließlich für Super-Admins einsehbar.",
        kpis: {
          totalInwardValue: "Gesamtwert Zugang",
          totalInwardGrns: "Wareneingänge (GRNs)",
          superAdminVerified: "Super-Admin geprüft",
          pendingReview: "Ausstehende Prüfung",
          bills: "Belege",
          pending: "Offen",
          consignments: "Eingänge"
        },
        filters: {
          allStreams: "Alle Eingangswege (3 Kanäle)",
          warehouseMaster: "Zentrallager Master",
          systemStock: "Bestand pro System",
          commercialProject: "Kommerzielle Großprojekte",
          allYears: "Alle Geschäftsjahre",
          allStatuses: "Alle Status",
          verified: "Geprüft & versiegelt",
          pendingAudit: "Prüfung ausstehend",
          searchPlaceholder: "Belegnr., Rechnungsnr., Lieferant, Stadt oder Datum..."
        },
        cardLabels: {
          timeAndDayPkt: "Genaue Uhrzeit & Tag (PKT)",
          vendorOrigin: "Lieferant & Herkunft",
          billAndInvoice: "Offizielle Lieferantenrechnung",
          uploadedByDept: "Erfasst von Abteilung",
          inwardQuantity: "Zugangsmenge",
          unitRate: "Einzelpreis (PKR)",
          lineTotal: "Gesamt (PKR)",
          batchSerial: "Charge / Seriennr.",
          materialPhotos: "Warenlieferung Originalfotos",
          billPhotos: "Lieferantenrechnung Originalfotos",
          verifiedPhysical: "Physisch verifiziert",
          securedInVault: "Im Tresor gesichert",
          confidentialNotice: "Rechnungen vertraulich: Belege sind für Super-Admin-Audits archiviert.",
          verifyAndApprove: "Rechnung prüfen & genehmigen"
        },
        modal: {
          title: "Wareneingang & Einkauf erfassen",
          mandatoryBadge: "Fotos & Rechnungen Pflicht",
          subtitle: "Einkaufsdaten eingeben. Bestand wird erst nach Upload von Warenfotos UND Lieferantenrechnung gebucht.",
          selectChannel: "Eingangskanal wählen (3 Kanäle):",
          centralWarehouse: "Zentrallager Hub",
          centralWarehouseDesc: "Hauptlager",
          stockInEachSystem: "Bestand pro System",
          stockInEachSystemDesc: "Projektspezifisch",
          largeCommercial: "Kommerzielles Großprojekt",
          largeCommercialDesc: "100kW - 1MW Standort",
          vendorHeading: "Lieferantendaten & Standort ('Herkunft')",
          livePktBadge: "Live PKT-Zeitstempel aktiv",
          vendorName: "Lieferantenname",
          vendorLocation: "Standort / Stadt des Lieferanten",
          vendorContact: "Kontakt / Telefon",
          paymentMethod: "Zahlungsart",
          billInvoiceNo: "Offizielle Rechnungsnummer",
          poNumber: "Bestellnummer (PO)",
          purchasedItems: "Gekaufte Artikel & Mengen:",
          addItemLine: "Position hinzufügen",
          mandatoryProofs: "Erforderliche Nachweise (Fotos & Rechnungen)",
          mandatoryProofsDesc: "Buchung ohne physische Fotos und Rechnungsbeleg gesperrt.",
          attachSample: "Musterrechnung & Fotos anfügen",
          uploadMaterial: "1. Fotos der gelieferten Ware",
          uploadMaterialDesc: "Fotos von abgeladenen Modulen, Wechselrichtern und Kabeln hochladen.",
          uploadBills: "2. Fotos der Lieferantenrechnung",
          uploadBillsDesc: "Gestempelte Rechnung oder Lieferschein hochladen.",
          mandatoryNoticeMaterial: "⚠️ Pflicht: Warenfoto erforderlich",
          mandatoryNoticeBill: "⚠️ Pflicht: Rechnungsbeleg erforderlich",
          purchasingNotes: "Prüfnotizen / Bemerkungen:",
          cancel: "Abbrechen",
          savePurchase: "Einkauf buchen & Bestand erhöhen"
        }
      }
    },

    common: {
      save: "Speichern",
      cancel: "Abbrechen",
      close: "Schließen",
      delete: "Löschen",
      edit: "Bearbeiten",
      search: "Suchen",
      filter: "Filtern",
      refresh: "Aktualisieren",
      download: "Herunterladen",
      print: "Drucken",
      verified: "Geprüft",
      pending: "Ausstehend",
      status: "Status",
      actions: "Aktionen",
      confidential: "Vertraulich",
      units: "Einheiten",
      all: "Alle",
      yes: "Ja",
      no: "Nein",
      loading: "Laden..."
    }
  },

  ru: {
    // Top Navigation (Русский)
    nav: {
      projects: "Все проекты",
      boq: "Спецификация (PKR)",
      inventory: "Склад и учет",
      proposal: "Предложение (PDF)",
      cad: "CAD HelioScope",
      survey: "Полевой осмотр",
      financial: "Доходность 25 лет",
      admin: "Супер-Администратор",
      audit: "Аудит и печать",
      liveErp: "Онлайн ERP",
      noActiveProjects: "Нет активных проектов",
      createNewProject: "Создать новый проект",
      companyProfile: "Профиль компании",
      changeColorTheme: "Цветовая тема",
      lightSaaS: "Светлая SaaS",
      cyberDark: "Кибер-Темная",
      softMint: "Нежная мята",
      impersonationNotice: "Режим супер-администратора",
      exitImpersonation: "Выйти из режима",
      selectLanguage: "Язык",
      switchLanguage: "Сменить язык"
    },

    // AutoCAD Single Line Diagram (SLD) Inspection & Architecture
    sld: {
      title: "Архитектура однолинейной схемы AutoCAD (SLD)",
      subtitle: "Полные электрические схемы, конфигурации стрингов и технические стандарты сетевого учета",
      downloadDxf: "Скачать AutoCAD (.DXF)",
      viewGuide: "Руководство AutoCAD SLD",
      discoSdoChecklist: "КОНТРОЛЬНЫЙ СПИСОК СЕТЕВОЙ КОМПАНИИ",
      standardLabel: "Стандарт",
      componentSpecs: "Спецификации компонента",
      components: {
        pv_array: {
          name: "Массив фотомодулей (Источник DC)",
          subtitle: "Солнечные стринги и генерация DC",
          category: "Генерация DC",
          specs: "Модули Tier-1 N-Type TOPCon / Двусторонние half-cell модули с герметичными разъемами MC4.",
          discoChecklist: "Проверка напряжения холостого хода Voc (< 1000V DC), тест полярности и проверка на PID."
        },
        dc_isolator: {
          name: "DC Выключатель и УЗИП Тип II",
          subtitle: "DC Изоляция и защита от перенапряжений",
          category: "Защита DC",
          specs: "Герметичный бокс IP66 с дугогасительными перегородками и подключением к контуру заземления.",
          discoChecklist: "Блокируемый ручной изолятор рядом с инвертором, разрядник перенапряжений Класс II."
        },
        inverter: {
          name: "Сетевой / Гибридный солнечный инвертор",
          subtitle: "Преобразование DC в AC и сетевая синхронизация",
          category: "Преобразование и синхронизация",
          specs: "Многоканальный MPPT стринг-инвертор с портом смарт-метра, RS485/WiFi и реле ограничения экспорта.",
          discoChecklist: "Тест защиты от работы на изолированную сеть (< 100мс), коэффициент мощности >= 0.95, AFCI."
        },
        ac_mccb: {
          name: "Распределительный щит AC и 4-полюсный автомат",
          subtitle: "AC Защита и сетевая изоляция",
          category: "Защита AC",
          specs: "Промышленный щит IP65 с автоматом Schneider/ABB MCCB и цифровым мультиметром.",
          discoChecklist: "4-полюсный разрыв всех 3 фаз и нейтрали, УЗИП Тип II и УЗО RCD 300мА."
        },
        bi_directional_meter: {
          name: "Двунаправленный счетчик зеленого тарифа",
          subtitle: "Зеленый счетчик (Импорт / Экспорт)",
          category: "Подключение к сети",
          specs: "Трехфазный 4-квадрантный счетчик, фиксирующий выработанные кВт·ч в зачет потребления из сети.",
          discoChecklist: "Пломба поверки лаборатории, оптопорт и регистрация раздельных профилей учета."
        },
        earth_pit: {
          name: "Химический контур заземления и молниезащита",
          subtitle: "Заземление (< 2.5 Ом сопротивление)",
          category: "Система заземления",
          specs: "Медный стержень длиной 3м в бентонитовом наполнителе с ревизионным колодцем.",
          discoChecklist: "Протокол измерения сопротивления заземления (< 2.5 Ом), раздельные DC/AC контуры."
        }
      }
    },

    inventory: {
      title: "Управление складом и запасами",
      subtitle: "Учет оборудования на центральных складах и распределение по солнечным системам",
      tabs: {
        system: "Запас по системам",
        warehouse: "Центральный склад",
        purchasing: "Закупки и счета",
        audit: "Движение склада и аудит"
      },
      kpis: {
        totalAssetValue: "Общая стоимость активов",
        availableInWarehouse: "В наличии на складах",
        allocatedToSystems: "Выделено под системы",
        lowStockAlerts: "Меньше порога безопасности",
        unitsM: "Шт/м",
        skus: "Артикулов"
      },
      systemAllocation: {
        selectProject: "Выберите систему / проект:",
        statusReady: "Оборудование 100% готово",
        statusPartial: "Частично на складе",
        statusDeficit: "Дефицит оборудования",
        allocateStock: "Выделить запас под систему",
        purchaseForSystem: "Закупить под систему (Фото и счета)",
        reserveAllBoq: "Зарезервировать всю спецификацию",
        dispatchGatePass: "Отгрузка и пропуск",
        releaseAll: "Освободить все",
        feasibilityTitle: "Готовность запасов оборудования",
        tableHeaders: {
          component: "Оборудование",
          skuWarehouse: "Артикул и склад",
          required: "Требуется",
          allocated: "Выделено",
          remainingNeeded: "Осталось",
          remainingWarehouse: "Свободно на складе",
          unitCost: "Цена за ед. (PKR)",
          status: "Статус",
          actions: "Действия"
        }
      },
      purchasingVault: {
        title: "Сейф закупок, счетов и оборудования",
        superAdminVaultBadge: "Сейф супер-администратора (Финансы)",
        purchasingDeptBadge: "Портал отдела закупок",
        superAdminSubtitle: "Эксклюзивный аудит: проверка счетов поставщиков, фото доставки и утверждение прихода.",
        purchasingDeptSubtitle: "Приемка оборудования: оформление закупок с обязательным фото оборудования и счетов.",
        recordNewPurchase: "Оформить новую закупку",
        inwardWarehouse: "+ Центральный склад",
        inwardSystem: "+ Запас системы",
        inwardCommercial: "+ Мега-Проект",
        policyActiveSuperAdmin: "Режим финансового аудита: Полный доступ к оригинальным счетам, фото и ценам закупки.",
        policyActiveStaff: "Политика конфиденциальности: Счета и закупочные цены доступны только супер-администраторам.",
        kpis: {
          totalInwardValue: "Сумма закупок",
          totalInwardGrns: "Всего накладных (GRN)",
          superAdminVerified: "Утверждено супер-админом",
          pendingReview: "На проверке",
          bills: "Счетов",
          pending: "В очереди",
          consignments: "Накладных"
        },
        filters: {
          allStreams: "Все 3 направления прихода",
          warehouseMaster: "Центральный склад",
          systemStock: "Запас по системам",
          commercialProject: "Крупные коммерческие объекты",
          allYears: "Все финансовые годы",
          allStatuses: "Все статусы",
          verified: "Утверждено",
          pendingAudit: "Ожидает аудита",
          searchPlaceholder: "Поиск накладной, счета, поставщика ('откуда'), города или даты..."
        },
        cardLabels: {
          timeAndDayPkt: "Точная дата и время (PKT)",
          vendorOrigin: "Поставщик ('Откуда')",
          billAndInvoice: "Официальный счет / накладная",
          uploadedByDept: "Кем оформлено",
          inwardQuantity: "Принятое количество",
          unitRate: "Цена за ед. (PKR)",
          lineTotal: "Всего (PKR)",
          batchSerial: "Партия / Серийный №",
          materialPhotos: "Фотографии доставленного оборудования",
          billPhotos: "Фотографии официальных счетов поставщика",
          verifiedPhysical: "Оборудование проверено",
          securedInVault: "Защищено в сейфе",
          confidentialNotice: "Счета конфиденциальны: загруженные документы архивируются для аудита супер-администратора.",
          verifyAndApprove: "Проверить и утвердить счет"
        },
        modal: {
          title: "Приход оборудования и оформление закупки",
          mandatoryBadge: "Фото и счета обязательны",
          subtitle: "Заполните данные поставщика. Оборудование будет зачислено только при наличии фото товара И счета.",
          selectChannel: "Выберите направление прихода:",
          centralWarehouse: "Центральный складской хаб",
          centralWarehouseDesc: "Основное общее хранение",
          stockInEachSystem: "Запас конкретной системы",
          stockInEachSystemDesc: "Выделено под проект",
          largeCommercial: "Крупный коммерческий объект",
          largeCommercialDesc: "Объект 100кВт - 1МВт",
          vendorHeading: "Данные поставщика ('Откуда закуплено')",
          livePktBadge: "Метка времени PKT активна",
          vendorName: "Наименование поставщика",
          vendorLocation: "Город / склад поставщика",
          vendorContact: "Контактный телефон",
          paymentMethod: "Способ оплаты",
          billInvoiceNo: "Номер официального счета / накладной",
          poNumber: "Номер заказа (PO)",
          purchasedItems: "Наименование и количество оборудования:",
          addItemLine: "Добавить позицию",
          mandatoryProofs: "Обязательные подтверждения (Фото и счета)",
          mandatoryProofsDesc: "Приход заблокирован без загрузки фото оборудования и счетов поставщика.",
          attachSample: "Прикрепить тестовые фото и счет",
          uploadMaterial: "1. Фотографии принятого оборудования",
          uploadMaterialDesc: "Загрузите фото панелей, инверторов и кабелей на складе или объекте.",
          uploadBills: "2. Фотографии счетов поставщика",
          uploadBillsDesc: "Загрузите фото счета с печатью или товарно-транспортной накладной.",
          mandatoryNoticeMaterial: "⚠️ Обязательно: требуется фото оборудования",
          mandatoryNoticeBill: "⚠️ Обязательно: требуется фото счета",
          purchasingNotes: "Примечания / акт приемки:",
          cancel: "Отмена",
          savePurchase: "Провести закупку на склад"
        }
      }
    },

    common: {
      save: "Сохранить",
      cancel: "Отмена",
      close: "Закрыть",
      delete: "Удалить",
      edit: "Редактировать",
      search: "Поиск",
      filter: "Фильтр",
      refresh: "Обновить",
      download: "Скачать",
      print: "Печать",
      verified: "Проверено",
      pending: "В ожидании",
      status: "Статус",
      actions: "Действия",
      confidential: "Конфиденциально",
      units: "Ед.",
      all: "Все",
      yes: "Да",
      no: "Нет",
      loading: "Загрузка..."
    }
  }
};
