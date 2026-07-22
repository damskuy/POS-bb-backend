import swaggerJSDoc from "swagger-jsdoc";

export const swaggerOptions: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "POS Bengkel REST API",
      version: "1.0.0",
      description:
        "Dokumentasi API backend POS Bengkel dengan Next.js App Router, Prisma, & JWT Authentication.",
      contact: {
        name: "POS Bengkel Developer",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Masukkan JWT Token pengguna (contoh: Bearer <token>)",
        },
      },
      schemas: {
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "object" },
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Internal server error" },
          },
        },
        ValidationErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            message: { type: "string", example: "Validation failed" },
            errors: { type: "object" },
          },
        },
        // Auth
        AuthLoginInput: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email", example: "admin@bengkel.com" },
            password: { type: "string", format: "password", example: "password123" },
          },
        },
        AuthLoginResponse: {
          type: "object",
          properties: {
            accessToken: { type: "string", example: "eyJhbGciOiJIUzI1Ni..." },
            token: { type: "string", example: "eyJhbGciOiJIUzI1Ni..." },
            user: {
              type: "object",
              properties: {
                id: { type: "integer", example: 1 },
                name: { type: "string", example: "Admin POS" },
                email: { type: "string", example: "admin@bengkel.com" },
                role: { type: "string", enum: ["OWNER", "ADMIN", "CASHIER", "MECHANIC"], example: "ADMIN" },
              },
            },
          },
        },
        // Customer
        Customer: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "Budi Santoso" },
            phone: { type: "string", example: "081234567890" },
            address: { type: "string", nullable: true, example: "Jl. Sudirman No. 123" },
            notes: { type: "string", nullable: true, example: "Pelanggan setia" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        CustomerInput: {
          type: "object",
          required: ["name", "phone"],
          properties: {
            name: { type: "string", example: "Budi Santoso" },
            phone: { type: "string", example: "081234567890" },
            address: { type: "string", example: "Jl. Sudirman No. 123" },
            notes: { type: "string", example: "Pelanggan setia" },
          },
        },
        // Vehicle
        Vehicle: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            customerId: { type: "integer", example: 1 },
            plateNumber: { type: "string", example: "B 1234 ABC" },
            brand: { type: "string", example: "Toyota" },
            model: { type: "string", example: "Avanza" },
            year: { type: "integer", nullable: true, example: 2020 },
            transmission: { type: "string", enum: ["MANUAL", "AUTOMATIC"], example: "AUTOMATIC" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        VehicleInput: {
          type: "object",
          required: ["customerId", "plateNumber", "brand", "model", "transmission"],
          properties: {
            customerId: { type: "integer", example: 1 },
            plateNumber: { type: "string", example: "B 1234 ABC" },
            brand: { type: "string", example: "Toyota" },
            model: { type: "string", example: "Avanza" },
            year: { type: "integer", example: 2020 },
            transmission: { type: "string", enum: ["MANUAL", "AUTOMATIC"], example: "AUTOMATIC" },
          },
        },
        // Mechanic
        Mechanic: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "Joko Susilo" },
            phone: { type: "string", example: "089876543210" },
            address: { type: "string", nullable: true, example: "Jl. Merdeka No. 45" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        MechanicInput: {
          type: "object",
          required: ["name", "phone"],
          properties: {
            name: { type: "string", example: "Joko Susilo" },
            phone: { type: "string", example: "089876543210" },
            address: { type: "string", example: "Jl. Merdeka No. 45" },
          },
        },
        // User
        User: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "Ahmad Kasir" },
            email: { type: "string", example: "ahmad@bengkel.com" },
            role: { type: "string", enum: ["OWNER", "ADMIN", "CASHIER", "MECHANIC"], example: "CASHIER" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        UserInput: {
          type: "object",
          required: ["name", "email", "password"],
          properties: {
            name: { type: "string", example: "Ahmad Kasir" },
            email: { type: "string", example: "ahmad@bengkel.com" },
            password: { type: "string", example: "password123" },
            role: { type: "string", enum: ["OWNER", "ADMIN", "CASHIER", "MECHANIC"], example: "CASHIER" },
          },
        },
        // Service
        Service: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "Servis Berkala 10.000 KM" },
            price: { type: "integer", example: 150000 },
            description: { type: "string", nullable: true, example: "Ganti oli dan cek mesin dasar" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        ServiceInput: {
          type: "object",
          required: ["name", "price"],
          properties: {
            name: { type: "string", example: "Servis Berkala 10.000 KM" },
            price: { type: "integer", example: 150000 },
            description: { type: "string", example: "Ganti oli dan cek mesin dasar" },
          },
        },
        // Service Package
        ServicePackage: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "Paket Hemat Tune-Up" },
            unitPrice: { type: "integer", example: 350000 },
            description: { type: "string", nullable: true, example: "Ganti oli + busi + tune up" },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        ServicePackageInput: {
          type: "object",
          required: ["name", "unitPrice"],
          properties: {
            name: { type: "string", example: "Paket Hemat Tune-Up" },
            unitPrice: { type: "integer", example: 350000 },
            description: { type: "string", example: "Ganti oli + busi + tune up" },
          },
        },
        // Service Package Item
        ServicePackageItem: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            servicePackageId: { type: "integer", example: 1 },
            serviceId: { type: "integer", nullable: true, example: 1 },
            sparePartId: { type: "integer", nullable: true, example: 2 },
            quantity: { type: "integer", example: 1 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        ServicePackageItemInput: {
          type: "object",
          required: ["servicePackageId"],
          properties: {
            servicePackageId: { type: "integer", example: 1 },
            serviceId: { type: "integer", example: 1 },
            sparePartId: { type: "integer", example: 2 },
            quantity: { type: "integer", example: 1 },
          },
        },
        // SparePart
        SparePart: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            name: { type: "string", example: "Oli Mesin Shell 1L" },
            sku: { type: "string", nullable: true, example: "OLI-SH-001" },
            stock: { type: "integer", example: 50 },
            price: { type: "integer", example: 85000 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        SparePartInput: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string", example: "Oli Mesin Shell 1L" },
            sku: { type: "string", example: "OLI-SH-001" },
            stock: { type: "integer", example: 50 },
            price: { type: "integer", example: 85000 },
          },
        },
        // WorkOrder
        WorkOrder: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            code: { type: "string", example: "WO-20260720-001" },
            customerId: { type: "integer", example: 1 },
            vehicleId: { type: "integer", example: 1 },
            mechanicId: { type: "integer", nullable: true, example: 1 },
            userId: { type: "integer", nullable: true, example: 1 },
            status: {
              type: "string",
              enum: ["PENDING", "IN_PROGRESS", "WAITING_PART", "READY", "COMPLETED", "CANCELLED"],
              example: "PENDING",
            },
            complaint: { type: "string", nullable: true, example: "Suara mesin kasar" },
            odometer: { type: "integer", nullable: true, example: 45000 },
            notes: { type: "string", nullable: true, example: "Harap periksa rem juga" },
            subtotal: { type: "integer", example: 235000 },
            discount: { type: "integer", example: 0 },
            tax: { type: "integer", example: 0 },
            grandTotal: { type: "integer", example: 235000 },
            checkInAt: { type: "string", format: "date-time", nullable: true },
            finishedAt: { type: "string", format: "date-time", nullable: true },
            scheduleDate: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        WorkOrderInput: {
          type: "object",
          required: ["customerId", "vehicleId"],
          properties: {
            customerId: { type: "integer", example: 1 },
            vehicleId: { type: "integer", example: 1 },
            mechanicId: { type: "integer", example: 1 },
            complaint: { type: "string", example: "Suara mesin kasar" },
            odometer: { type: "integer", example: 45000 },
            notes: { type: "string", example: "Harap periksa rem juga" },
            discount: { type: "integer", example: 0 },
            tax: { type: "integer", example: 0 },
            scheduleDate: { type: "string", format: "date-time" },
          },
        },
        WorkOrderService: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            workOrderId: { type: "integer", example: 1 },
            serviceId: { type: "integer", example: 1 },
            price: { type: "integer", example: 150000 },
            quantity: { type: "integer", example: 1 },
            subtotal: { type: "integer", example: 150000 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        WorkOrderServiceInput: {
          type: "object",
          required: ["serviceId"],
          properties: {
            serviceId: { type: "integer", example: 1 },
            price: { type: "integer", example: 150000 },
            quantity: { type: "integer", example: 1 },
          },
        },
        WorkOrderPart: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            workOrderId: { type: "integer", example: 1 },
            sparePartId: { type: "integer", example: 1 },
            price: { type: "integer", example: 85000 },
            quantity: { type: "integer", example: 1 },
            subtotal: { type: "integer", example: 85000 },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        WorkOrderPartInput: {
          type: "object",
          required: ["sparePartId"],
          properties: {
            sparePartId: { type: "integer", example: 1 },
            price: { type: "integer", example: 85000 },
            quantity: { type: "integer", example: 1 },
          },
        },
        // Payment
        Payment: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            workOrderId: { type: "integer", example: 1 },
            method: { type: "string", enum: ["CASH", "QRIS", "TRANSFER", "EWALLET"], example: "CASH" },
            amount: { type: "integer", example: 235000 },
            status: { type: "string", enum: ["UNPAID", "PARTIAL", "PAID"], example: "PAID" },
            referenceNumber: { type: "string", nullable: true, example: "REF-998877" },
            paidAt: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        PaymentInput: {
          type: "object",
          required: ["workOrderId", "method", "amount"],
          properties: {
            workOrderId: { type: "integer", example: 1 },
            method: { type: "string", enum: ["CASH", "QRIS", "TRANSFER", "EWALLET"], example: "CASH" },
            amount: { type: "integer", example: 235000 },
            referenceNumber: { type: "string", example: "REF-998877" },
          },
        },
        // Invoice
        Invoice: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            invoiceNumber: { type: "string", example: "INV-20260720-001" },
            workOrderId: { type: "integer", example: 1 },
            status: { type: "string", nullable: true, example: "PAID" },
            issuedAt: { type: "string", format: "date-time", nullable: true },
            printedAt: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
          },
        },
        InvoiceInput: {
          type: "object",
          required: ["workOrderId"],
          properties: {
            workOrderId: { type: "integer", example: 1 },
            status: { type: "string", example: "DRAFT" },
          },
        },
        // AuditLog
        AuditLog: {
          type: "object",
          properties: {
            id: { type: "integer", example: 1 },
            userId: { type: "integer", nullable: true, example: 1 },
            action: { type: "string", example: "CREATE" },
            entity: { type: "string", example: "Customer" },
            entityId: { type: "integer", nullable: true, example: 1 },
            oldData: { type: "object", nullable: true },
            newData: { type: "object", nullable: true },
            ipAddress: { type: "string", nullable: true, example: "127.0.0.1" },
            userAgent: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        // Dashboard
        DashboardSummary: {
          type: "object",
          properties: {
            totalWorkOrders: { type: "integer", example: 120 },
            pendingWorkOrders: { type: "integer", example: 15 },
            completedWorkOrders: { type: "integer", example: 95 },
            totalRevenue: { type: "integer", example: 45000000 },
            totalCustomers: { type: "integer", example: 85 },
            totalSpareParts: { type: "integer", example: 340 },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    tags: [
      { name: "Auth", description: "Endpoint Autentikasi User (Login & Profile)" },
      { name: "Customer", description: "Manajemen Data Pelanggan Bengkel" },
      { name: "Vehicle", description: "Manajemen Kendaraan Pelanggan" },
      { name: "Mechanic", description: "Manajemen Data Mekanik" },
      { name: "User", description: "Manajemen Pengguna & Pengaturan Hak Akses (RBAC)" },
      { name: "Service", description: "Manajemen Jasa Servis, Paket Servis, & Item Paket" },
      { name: "SparePart", description: "Manajemen Suku Cadang & Stok Inventory" },
      { name: "WorkOrder", description: "Manajemen Perintah Kerja / Service Order" },
      { name: "Payment", description: "Manajemen Pembayaran & Transaksi" },
      { name: "Invoice", description: "Manajemen Faktur & Tagihan" },
      { name: "Dashboard", description: "Ringkasan Metrik & Statistik Utama Bengkel" },
      { name: "Reports", description: "Laporan Pendapatan, Work Order, Pelanggan, Servis & Spare Part" },
      { name: "Audit Logs", description: "Riwayat Log Aktivitas & Jejak Audit Pengguna" },
    ],
  },
  apis: ["./app/api/**/*.ts", "./lib/swagger.ts"],
};

export const getApiDocs = async () => {
  const spec = swaggerJSDoc(swaggerOptions);
  return spec;
};
