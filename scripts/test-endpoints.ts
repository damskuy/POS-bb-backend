import jwt from "jsonwebtoken";
import fs from "fs";
import path from "path";

const PORT = process.env.PORT || "3001";
const API_BASE = `http://localhost:${PORT}/api`;

let JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, "utf-8");
      const match = envContent.match(/^JWT_SECRET=(.*)$/m);
      if (match) {
        JWT_SECRET = match[1].trim();
      }
    }
  } catch (err) {
    console.error("Failed to read .env file for JWT_SECRET:", err);
  }
}
if (!JWT_SECRET) {
  JWT_SECRET = "super_secret_key_123456789";
}
const adminToken = jwt.sign({ id: 9999, email: "admin@test.com", role: "ADMIN" }, JWT_SECRET);

const originalFetch = globalThis.fetch;
globalThis.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

  if (url.includes("/api/auth/login")) {
    return originalFetch(input, init);
  }

  const headers = new Headers(init?.headers);

  if (headers.get("Authorization") === "none") {
    headers.delete("Authorization");
  } else if (!headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${adminToken}`);
  }

  return originalFetch(input, {
    ...init,
    headers,
  });
} as any;


async function getJson(res: any) {
  const json = await res.json();
  return json && json.data !== undefined ? json.data : json;
}

async function main() {
  console.log(`Starting API integration tests on: ${API_BASE}\n`);
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, message: string) {
    if (condition) {
      passed++;
      console.log(`  ✓ ${message}`);
    } else {
      failed++;
      console.log(`  ✗ ${message}`);
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  const ts = Math.floor(Date.now() / 1000);

  try {
    // ----------------------------------------------------
    // 1. CUSTOMERS
    // ----------------------------------------------------
    console.log("=== Testing CUSTOMERS ===");
    const customerPayload = {
      name: `Test Customer ${ts}`,
      phone: `+628${ts}`,
      address: `Jl. Test No. ${ts}`,
      notes: "Test customer notes"
    };

    const createCustomerRes = await fetch(`${API_BASE}/customers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(customerPayload)
    });
    if (createCustomerRes.status !== 201) {
      console.log("FAILED STATUS:", createCustomerRes.status);
      console.log("FAILED BODY:", await createCustomerRes.text());
    }
    assert(createCustomerRes.status === 201, `POST /api/customers returns 201`);
    const createdCustomer = await getJson(createCustomerRes);
    assert(createdCustomer.id !== undefined, "Created customer has ID");
    assert(createdCustomer.name === customerPayload.name, "Created customer has correct name");

    const customerId = createdCustomer.id;

    const listCustomersRes = await fetch(`${API_BASE}/customers`);
    assert(listCustomersRes.status === 200, `GET /api/customers returns 200`);
    const customersList = await getJson(listCustomersRes);
    assert(Array.isArray(customersList), "GET /api/customers returns array");
    assert(customersList.some((c: any) => c.id === customerId), "Customer list contains created customer");

    const getCustomerRes = await fetch(`${API_BASE}/customers/${customerId}`);
    assert(getCustomerRes.status === 200, `GET /api/customers/${customerId} returns 200`);
    const customerDetail = await getJson(getCustomerRes);
    assert(customerDetail.id === customerId, "Fetched customer detail has correct ID");

    const updatedCustomerName = `Updated Customer ${ts}`;
    const patchCustomerRes = await fetch(`${API_BASE}/customers/${customerId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: updatedCustomerName })
    });
    assert(patchCustomerRes.status === 200, `PATCH /api/customers/${customerId} returns 200`);
    const patchedCustomer = await getJson(patchCustomerRes);
    assert(patchedCustomer.name === updatedCustomerName, "Customer name successfully updated");

    // ----------------------------------------------------
    // 2. VEHICLES
    // ----------------------------------------------------
    console.log("\n=== Testing VEHICLES ===");
    const vehiclePayload = {
      customerId: customerId,
      plateNumber: `B ${ts} TEST`,
      brand: "Toyota",
      model: "Avanza",
      year: 2020,
      transmission: "MANUAL"
    };

    const createVehicleRes = await fetch(`${API_BASE}/vehicles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(vehiclePayload)
    });
    assert(createVehicleRes.status === 201, `POST /api/vehicles returns 201`);
    const createdVehicle = await getJson(createVehicleRes);
    assert(createdVehicle.id !== undefined, "Created vehicle has ID");

    const vehicleId = createdVehicle.id;

    const listVehiclesRes = await fetch(`${API_BASE}/vehicles`);
    assert(listVehiclesRes.status === 200, `GET /api/vehicles returns 200`);
    const vehiclesList = await getJson(listVehiclesRes);
    assert(Array.isArray(vehiclesList), "GET /api/vehicles returns array");

    const getVehicleRes = await fetch(`${API_BASE}/vehicles/${vehicleId}`);
    assert(getVehicleRes.status === 200, `GET /api/vehicles/${vehicleId} returns 200`);
    const vehicleDetail = await getJson(getVehicleRes);
    assert(vehicleDetail.id === vehicleId, "Fetched vehicle detail has correct ID");

    const updatedBrand = "Honda";
    const patchVehicleRes = await fetch(`${API_BASE}/vehicles/${vehicleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand: updatedBrand })
    });
    assert(patchVehicleRes.status === 200, `PATCH /api/vehicles/${vehicleId} returns 200`);
    const patchedVehicle = await getJson(patchVehicleRes);
    assert(patchedVehicle.brand === updatedBrand, "Vehicle brand successfully updated");

    // Filter vehicle by customerId
    const filterVehicleCustomerIdRes = await fetch(`${API_BASE}/vehicles?customerId=${customerId}`);
    assert(filterVehicleCustomerIdRes.status === 200, `GET /api/vehicles?customerId=${customerId} returns 200`);
    const filterVehicleCustomerIdList = await getJson(filterVehicleCustomerIdRes);
    assert(filterVehicleCustomerIdList.every((v: any) => v.customerId === customerId), "Filtered vehicles customerId works");

    // Filter vehicle by transmission
    const filterVehicleTransmissionRes = await fetch(`${API_BASE}/vehicles?transmission=MANUAL`);
    assert(filterVehicleTransmissionRes.status === 200, `GET /api/vehicles?transmission=MANUAL returns 200`);
    const filterVehicleTransmissionList = await getJson(filterVehicleTransmissionRes);
    assert(filterVehicleTransmissionList.every((v: any) => v.transmission === "MANUAL"), "Filtered vehicles transmission works");

    // ----------------------------------------------------
    // 3. MECHANICS
    // ----------------------------------------------------
    console.log("\n=== Testing MECHANICS ===");
    const mechanicPayload = {
      name: `Mechanic ${ts}`,
      phone: `081${ts}`,
      address: `Bengkel Street ${ts}`
    };

    const createMechanicRes = await fetch(`${API_BASE}/mechanics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(mechanicPayload)
    });
    assert(createMechanicRes.status === 201, `POST /api/mechanics returns 201`);
    const createdMechanic = await getJson(createMechanicRes);
    const mechanicId = createdMechanic.id;

    const listMechanicsRes = await fetch(`${API_BASE}/mechanics`);
    assert(listMechanicsRes.status === 200, `GET /api/mechanics returns 200`);

    const getMechanicRes = await fetch(`${API_BASE}/mechanics/${mechanicId}`);
    assert(getMechanicRes.status === 200, `GET /api/mechanics/${mechanicId} returns 200`);

    const updatedMechanicName = `Updated Mechanic ${ts}`;
    const patchMechanicRes = await fetch(`${API_BASE}/mechanics/${mechanicId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: updatedMechanicName })
    });
    assert(patchMechanicRes.status === 200, `PATCH /api/mechanics/${mechanicId} returns 200`);
    const patchedMechanic = await getJson(patchMechanicRes);
    assert(patchedMechanic.name === updatedMechanicName, "Mechanic name successfully updated");

    // Mechanic sorting verification
    const sortMechanicNameRes = await fetch(`${API_BASE}/mechanics?sort=name&order=asc`);
    assert(sortMechanicNameRes.status === 200, `GET /api/mechanics?sort=name returns 200`);

    // ----------------------------------------------------
    // 4. SERVICES
    // ----------------------------------------------------
    console.log("\n=== Testing SERVICES ===");
    const servicePayload = {
      name: `Service Tune Up ${ts}`,
      price: 150000,
      description: "Standard tune up"
    };

    const createServiceRes = await fetch(`${API_BASE}/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(servicePayload)
    });
    assert(createServiceRes.status === 201, `POST /api/services returns 201`);
    const createdService = await getJson(createServiceRes);
    const serviceId = createdService.id;

    const listServicesRes = await fetch(`${API_BASE}/services`);
    assert(listServicesRes.status === 200, `GET /api/services returns 200`);

    const getServiceRes = await fetch(`${API_BASE}/services/${serviceId}`);
    assert(getServiceRes.status === 200, `GET /api/services/${serviceId} returns 200`);
    const serviceDetail = await getJson(getServiceRes);
    assert(Array.isArray(serviceDetail.packageItems), "Service detail includes packageItems relation");

    const updatedPrice = 175000;
    const patchServiceRes = await fetch(`${API_BASE}/services/${serviceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: updatedPrice })
    });
    assert(patchServiceRes.status === 200, `PATCH /api/services/${serviceId} returns 200`);
    const patchedService = await getJson(patchServiceRes);
    assert(patchedService.price === updatedPrice, "Service price successfully updated");

    // Restore original price for subsequent tests
    const restoreServiceRes = await fetch(`${API_BASE}/services/${serviceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: 150000 })
    });
    assert(restoreServiceRes.status === 200, "Restore service price to 150000 returns 200");

    // ----------------------------------------------------
    // 5. SPARE PARTS
    // ----------------------------------------------------
    console.log("\n=== Testing SPARE PARTS ===");
    const sparePartPayload = {
      name: `Brake Pad ${ts}`,
      sku: `SKU-${ts}`,
      stock: 50,
      price: 250000
    };

    const createSparePartRes = await fetch(`${API_BASE}/spare_parts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sparePartPayload)
    });
    assert(createSparePartRes.status === 201, `POST /api/spare_parts returns 201`);
    const createdSparePart = await getJson(createSparePartRes);
    const sparePartId = createdSparePart.id;

    const listSparePartsRes = await fetch(`${API_BASE}/spare_parts`);
    assert(listSparePartsRes.status === 200, `GET /api/spare_parts returns 200`);

    const getSparePartRes = await fetch(`${API_BASE}/spare_parts/${sparePartId}`);
    assert(getSparePartRes.status === 200, `GET /api/spare_parts/${sparePartId} returns 200`);
    const sparePartDetail = await getJson(getSparePartRes);
    assert(Array.isArray(sparePartDetail.packageItems), "Spare part detail includes packageItems relation");

    // Test low stock filter
    const lowStockRes = await fetch(`${API_BASE}/spare_parts?lowStock=true`);
    assert(lowStockRes.status === 200, `GET /api/spare_parts?lowStock=true returns 200`);
    const lowStockList = await getJson(lowStockRes);
    assert(lowStockList.every((p: any) => p.stock <= 5), "lowStock filter returns only spare parts with stock <= 5");

    const updatedStock = 60;
    const patchSparePartRes = await fetch(`${API_BASE}/spare_parts/${sparePartId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stock: updatedStock })
    });
    assert(patchSparePartRes.status === 200, `PATCH /api/spare_parts/${sparePartId} returns 200`);
    const patchedSparePart = await getJson(patchSparePartRes);
    assert(patchedSparePart.stock === updatedStock, "Spare part stock successfully updated");

    // ----------------------------------------------------
    // 6. SERVICE PACKAGES
    // ----------------------------------------------------
    console.log("\n=== Testing SERVICE PACKAGES ===");
    const packagePayload = {
      name: `Super Service Package ${ts}`,
      price: 500000,
      description: "Full service package including brake check and tune up"
    };

    const createPackageRes = await fetch(`${API_BASE}/service_packages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(packagePayload)
    });
    assert(createPackageRes.status === 201, `POST /api/service_packages returns 201`);
    const createdPackage = await getJson(createPackageRes);
    const packageId = createdPackage.id;

    const listPackagesRes = await fetch(`${API_BASE}/service_packages`);
    assert(listPackagesRes.status === 200, `GET /api/service_packages returns 200`);

    const getPackageRes = await fetch(`${API_BASE}/service_packages/${packageId}`);
    assert(getPackageRes.status === 200, `GET /api/service_packages/${packageId} returns 200`);

    const updatedPackagePrice = 550000;
    const patchPackageRes = await fetch(`${API_BASE}/service_packages/${packageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ price: updatedPackagePrice })
    });
    assert(patchPackageRes.status === 200, `PATCH /api/service_packages/${packageId} returns 200`);
    const patchedPackage = await getJson(patchPackageRes);
    assert(patchedPackage.price === updatedPackagePrice, "Service package price successfully updated");

    // ----------------------------------------------------
    // 7. SERVICE PACKAGE ITEMS
    // ----------------------------------------------------
    console.log("\n=== Testing SERVICE PACKAGE ITEMS ===");
    const packageItemPayload = {
      servicePackageId: packageId,
      serviceId: serviceId,
      sparePartId: sparePartId,
      quantity: 2
    };

    const createPackageItemRes = await fetch(`${API_BASE}/service_package_items`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(packageItemPayload)
    });
    assert(createPackageItemRes.status === 201, `POST /api/service_package_items returns 201`);
    const createdPackageItem = await getJson(createPackageItemRes);
    const packageItemId = createdPackageItem.id;

    const listPackageItemsRes = await fetch(`${API_BASE}/service_package_items`);
    assert(listPackageItemsRes.status === 405, `GET /api/service_package_items returns 405 Method Not Allowed`);

    const getPackageItemRes = await fetch(`${API_BASE}/service_package_items/${packageItemId}`);
    assert(getPackageItemRes.status === 200, `GET /api/service_package_items/${packageItemId} returns 200`);

    const updatedQuantity = 3;
    const patchPackageItemRes = await fetch(`${API_BASE}/service_package_items/${packageItemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: updatedQuantity })
    });
    assert(patchPackageItemRes.status === 200, `PATCH /api/service_package_items/${packageItemId} returns 200`);
    const patchedPackageItem = await getJson(patchPackageItemRes);
    assert(patchedPackageItem.quantity === updatedQuantity, "Package item quantity successfully updated");

    // ----------------------------------------------------
    // 8. USERS
    // ----------------------------------------------------
    console.log("\n=== Testing USERS ===");
    const userPayload = {
      name: `User ${ts}`,
      email: `user_${ts}@bengkel.com`,
      password: "secretpassword",
      role: "ADMIN"
    };

    const createUserRes = await fetch(`${API_BASE}/users`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userPayload)
    });
    assert(createUserRes.status === 201, `POST /api/users returns 201`);
    const createdUser = await getJson(createUserRes);
    const userId = createdUser.id;

    const listUsersRes = await fetch(`${API_BASE}/users`);
    assert(listUsersRes.status === 200, `GET /api/users returns 200`);

    const getUserRes = await fetch(`${API_BASE}/users/${userId}`);
    assert(getUserRes.status === 200, `GET /api/users/${userId} returns 200`);

    const updatedRole = "OWNER";
    const patchUserRes = await fetch(`${API_BASE}/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: updatedRole })
    });
    assert(patchUserRes.status === 200, `PATCH /api/users/${userId} returns 200`);
    const patchedUser = await getJson(patchUserRes);
    assert(patchedUser.role === updatedRole, "User role successfully updated");

    // User filter by role verification
    const filterUserRoleRes = await fetch(`${API_BASE}/users?role=OWNER`);
    assert(filterUserRoleRes.status === 200, `GET /api/users?role=OWNER returns 200`);
    const filterUserRoleList = await getJson(filterUserRoleRes);
    assert(filterUserRoleList.every((u: any) => u.role === "OWNER"), "Filtered users role works");

    console.log("\n=== Testing AUTHENTICATION ENDPOINTS ===");
    // 1. POST /api/auth/login with wrong password
    const loginWrongRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userPayload.email,
        password: "wrongpassword123"
      })
    });
    assert(loginWrongRes.status === 401, "POST /api/auth/login with invalid password returns 401");

    // 2. POST /api/auth/login with valid credentials
    const loginCorrectRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userPayload.email,
        password: userPayload.password
      })
    });
    assert(loginCorrectRes.status === 200, "POST /api/auth/login with valid credentials returns 200");
    const loginData = await getJson(loginCorrectRes);
    assert(loginData.accessToken !== undefined, "Login response contains accessToken");
    assert(loginData.user.email === userPayload.email, "Login response contains user payload");

    // 3. GET /api/auth/me with valid token
    const meValidRes = await fetch(`${API_BASE}/auth/me`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${loginData.accessToken}`
      }
    });
    assert(meValidRes.status === 200, "GET /api/auth/me with valid Bearer token returns 200");
    const meData = await getJson(meValidRes);
    assert(meData.email === userPayload.email, "GET /api/auth/me returns authenticated user's profile");

    // 4. GET /api/auth/me without token
    const meNoTokenRes = await fetch(`${API_BASE}/auth/me`, {
      method: "GET",
      headers: { "Authorization": "none" }
    });
    assert(meNoTokenRes.status === 401, "GET /api/auth/me without token returns 401");


    // ----------------------------------------------------
    // 9. WORK ORDERS
    // ----------------------------------------------------
    console.log("\n=== Testing WORK ORDERS ===");
    const workOrderPayload = {
      customerId: customerId,
      vehicleId: vehicleId,
      mechanicId: mechanicId,
      userId: userId,
      status: "PENDING",
      complaint: "Rem berbunyi saat ditekan",
      odometer: 12500,
      notes: "Cek juga tekanan angin ban",
      discount: 10000,
      tax: 5000,
      services: [
        {
          serviceId: serviceId,
          price: 150000,
          quantity: 1,
        }
      ],
      parts: [
        {
          sparePartId: sparePartId,
          price: 250000,
          quantity: 1,
        }
      ]
    };

    // Verify that passing code explicitly returns a validation error 400
    const createWithCodeRes = await fetch(`${API_BASE}/work-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...workOrderPayload, code: "WO-MANUAL-123" })
    });
    assert(createWithCodeRes.status === 400, "POST /api/work-orders with code field returns 400 Bad Request");

    const createWorkOrderRes = await fetch(`${API_BASE}/work-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(workOrderPayload)
    });
    assert(createWorkOrderRes.status === 201, `POST /api/work-orders returns 201`);
    const createdWorkOrder = await getJson(createWorkOrderRes);
    const workOrderId = createdWorkOrder.id;
    assert(workOrderId !== undefined, "Created work order has ID");
    assert(createdWorkOrder.code !== undefined, "Created work order has code generated");
    assert(createdWorkOrder.subtotal === 400000, "Calculated subtotal is correct (150000 + 250000 = 400000)");
    assert(createdWorkOrder.grandTotal === 395000, "Calculated grandTotal is correct (400000 - 10000 + 5000 = 395000)");

    const listWorkOrdersRes = await fetch(`${API_BASE}/work-orders`);
    assert(listWorkOrdersRes.status === 200, `GET /api/work-orders returns 200`);
    const workOrdersList = await getJson(listWorkOrdersRes);
    assert(Array.isArray(workOrdersList), "GET /api/work-orders returns array");

    const getWorkOrderRes = await fetch(`${API_BASE}/work-orders/${workOrderId}`);
    assert(getWorkOrderRes.status === 200, `GET /api/work-orders/${workOrderId} returns 200`);
    const workOrderDetail = await getJson(getWorkOrderRes);
    assert(workOrderDetail.id === workOrderId, "Fetched work order detail has correct ID");

    const updatedComplaint = "Rem berbunyi keras sekali saat ditekan";
    // Verify that PATCH with code returns a validation error 400
    const patchWithCodeRes = await fetch(`${API_BASE}/work-orders/${workOrderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: "WO-MODIFIED-123" })
    });
    assert(patchWithCodeRes.status === 400, "PATCH /api/work-orders/:id with code field returns 400 Bad Request");

    const patchWorkOrderRes = await fetch(`${API_BASE}/work-orders/${workOrderId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ complaint: updatedComplaint, status: "IN_PROGRESS" })
    });
    assert(patchWorkOrderRes.status === 200, `PATCH /api/work-orders/${workOrderId} returns 200`);
    const patchedWorkOrder = await getJson(patchWorkOrderRes);
    assert(patchedWorkOrder.complaint === updatedComplaint, "Work order complaint successfully updated");
    assert(patchedWorkOrder.status === "IN_PROGRESS", "Work order status successfully updated");

    // === Testing WORK ORDER STATUS TRANSITION VALIDATION ===
    console.log("\n=== Testing WORK ORDER STATUS TRANSITIONS ===");
    // Create a temporary work order for status testing
    const statusWoRes = await fetch(`${API_BASE}/work-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: customerId,
        vehicleId: vehicleId,
        complaint: "Test status transitions",
      })
    });
    assert(statusWoRes.status === 201, "POST status test work order returns 201");
    const statusWo = await getJson(statusWoRes);
    const statusWoId = statusWo.id;

    // 1. PENDING -> PAID (Invalid)
    const pendingToPaidRes = await fetch(`${API_BASE}/work-orders/${statusWoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID" })
    });
    assert(pendingToPaidRes.status === 400, "PATCH PENDING -> PAID returns 400 Bad Request");

    // 2. PENDING -> COMPLETED (Invalid)
    const pendingToCompletedRes = await fetch(`${API_BASE}/work-orders/${statusWoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" })
    });
    assert(pendingToCompletedRes.status === 400, "PATCH PENDING -> COMPLETED returns 400 Bad Request");

    // 3. PENDING -> IN_PROGRESS (Valid)
    const pendingToInProgressRes = await fetch(`${API_BASE}/work-orders/${statusWoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "IN_PROGRESS" })
    });
    assert(pendingToInProgressRes.status === 200, "PATCH PENDING -> IN_PROGRESS returns 200 OK");
    const inProgressWo = await getJson(pendingToInProgressRes);
    assert(inProgressWo.status === "IN_PROGRESS", "Status is IN_PROGRESS");

    // 4. IN_PROGRESS -> PENDING (Invalid)
    const inProgressToPendingRes = await fetch(`${API_BASE}/work-orders/${statusWoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PENDING" })
    });
    assert(inProgressToPendingRes.status === 400, "PATCH IN_PROGRESS -> PENDING returns 400 Bad Request");

    // 5. IN_PROGRESS -> WAITING_PART (Valid)
    const inProgressToWaitingPartRes = await fetch(`${API_BASE}/work-orders/${statusWoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "WAITING_PART" })
    });
    assert(inProgressToWaitingPartRes.status === 200, "PATCH IN_PROGRESS -> WAITING_PART returns 200 OK");
    const waitingPartWo = await getJson(inProgressToWaitingPartRes);
    assert(waitingPartWo.status === "WAITING_PART", "Status is WAITING_PART");

    // 6. WAITING_PART -> COMPLETED (Valid)
    const waitingPartToCompletedRes = await fetch(`${API_BASE}/work-orders/${statusWoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETED" })
    });
    assert(waitingPartToCompletedRes.status === 200, "PATCH WAITING_PART -> COMPLETED returns 200 OK");
    const completedWo = await getJson(waitingPartToCompletedRes);
    assert(completedWo.status === "COMPLETED", "Status is COMPLETED");

    // 7. COMPLETED -> PENDING (Invalid)
    const completedToPendingRes = await fetch(`${API_BASE}/work-orders/${statusWoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PENDING" })
    });
    assert(completedToPendingRes.status === 400, "PATCH COMPLETED -> PENDING returns 400 Bad Request");

    // 8. COMPLETED -> PAID (Valid)
    const completedToPaidRes = await fetch(`${API_BASE}/work-orders/${statusWoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID" })
    });
    assert(completedToPaidRes.status === 200, "PATCH COMPLETED -> PAID returns 200 OK");
    const paidWo = await getJson(completedToPaidRes);
    // DB status is COMPLETED
    assert(paidWo.status === "COMPLETED", "DB Status remains COMPLETED");
    // Verify payment record is PAID
    const verifyPaidWoRes = await fetch(`${API_BASE}/work-orders/${statusWoId}`);
    const verifyPaidWo = await getJson(verifyPaidWoRes);
    assert(verifyPaidWo.payment !== null && verifyPaidWo.payment.status === "PAID", "Effective payment status is PAID");

    // 9. PAID -> IN_PROGRESS (Invalid)
    const paidToInProgressRes = await fetch(`${API_BASE}/work-orders/${statusWoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "IN_PROGRESS" })
    });
    assert(paidToInProgressRes.status === 400, "PATCH PAID -> IN_PROGRESS returns 400 Bad Request");

    // Cleanup transition test work order
    const cleanupPaymentRes = await fetch(`${API_BASE}/payments/${verifyPaidWo.payment.id}`, {
      method: "DELETE"
    });
    assert(cleanupPaymentRes.status === 200, "Delete status test payment returns 200");

    const cleanupWoRes = await fetch(`${API_BASE}/work-orders/${statusWoId}`, {
      method: "DELETE"
    });
    assert(cleanupWoRes.status === 200, "Delete status test work order returns 200");


    // ----------------------------------------------------
    // WORK ORDERS FILTERING TESTS
    // ----------------------------------------------------
    console.log("=== Testing WORK ORDERS filters ===");
    
    // 1. Filter by status
    const filterStatusRes = await fetch(`${API_BASE}/work-orders?status=IN_PROGRESS`);
    assert(filterStatusRes.status === 200, `GET /api/work-orders?status=IN_PROGRESS returns 200`);
    const filterStatusList = await getJson(filterStatusRes);
    assert(filterStatusList.every((wo: any) => wo.status === "IN_PROGRESS"), "All returned work orders have IN_PROGRESS status");
    assert(filterStatusList.some((wo: any) => wo.id === workOrderId), "Filtered status list includes our work order");

    // 2. Filter by customerId
    const filterCustomerRes = await fetch(`${API_BASE}/work-orders?customerId=${customerId}`);
    assert(filterCustomerRes.status === 200, `GET /api/work-orders?customerId=${customerId} returns 200`);
    const filterCustomerList = await getJson(filterCustomerRes);
    assert(filterCustomerList.every((wo: any) => wo.customerId === customerId), "All returned work orders belong to correct customer");
    assert(filterCustomerList.some((wo: any) => wo.id === workOrderId), "Filtered customer list includes our work order");

    // 3. Filter by mechanicId
    const filterMechanicRes = await fetch(`${API_BASE}/work-orders?mechanicId=${mechanicId}`);
    assert(filterMechanicRes.status === 200, `GET /api/work-orders?mechanicId=${mechanicId} returns 200`);
    const filterMechanicList = await getJson(filterMechanicRes);
    assert(filterMechanicList.every((wo: any) => wo.mechanicId === mechanicId), "All returned work orders belong to correct mechanic");
    assert(filterMechanicList.some((wo: any) => wo.id === workOrderId), "Filtered mechanic list includes our work order");

    // 4. Filter by vehicleId
    const filterVehicleRes = await fetch(`${API_BASE}/work-orders?vehicleId=${vehicleId}`);
    assert(filterVehicleRes.status === 200, `GET /api/work-orders?vehicleId=${vehicleId} returns 200`);
    const filterVehicleList = await getJson(filterVehicleRes);
    assert(filterVehicleList.every((wo: any) => wo.vehicleId === vehicleId), "All returned work orders belong to correct vehicle");
    assert(filterVehicleList.some((wo: any) => wo.id === workOrderId), "Filtered vehicle list includes our work order");

    // 5. Filter by userId
    const filterUserRes = await fetch(`${API_BASE}/work-orders?userId=${userId}`);
    assert(filterUserRes.status === 200, `GET /api/work-orders?userId=${userId} returns 200`);
    const filterUserList = await getJson(filterUserRes);
    assert(filterUserList.every((wo: any) => wo.userId === userId), "All returned work orders belong to correct user");
    assert(filterUserList.some((wo: any) => wo.id === workOrderId), "Filtered user list includes our work order");

    // 6. Filter by search (complaint query)
    const searchRes1 = await fetch(`${API_BASE}/work-orders?search=keras`);
    assert(searchRes1.status === 200, `GET /api/work-orders?search=keras returns 200`);
    const searchList1 = await getJson(searchRes1);
    assert(searchList1.some((wo: any) => wo.id === workOrderId), "Search by complaint keyword returns our work order");

    // 7. Filter by search (plate number)
    const searchRes2 = await fetch(`${API_BASE}/work-orders?search=${ts}`);
    assert(searchRes2.status === 200, `GET /api/work-orders?search=${ts} returns 200`);
    const searchList2 = await getJson(searchRes2);
    assert(searchList2.some((wo: any) => wo.id === workOrderId), "Search by plate number keyword returns our work order");

    // 8. Filter by date range (startDate & endDate)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const startDateStr = yesterday.toISOString().split("T")[0];
    const endDateStr = tomorrow.toISOString().split("T")[0];

    const filterDateRes = await fetch(`${API_BASE}/work-orders?startDate=${startDateStr}&endDate=${endDateStr}`);
    assert(filterDateRes.status === 200, `GET /api/work-orders?startDate=${startDateStr}&endDate=${endDateStr} returns 200`);
    const filterDateList = await getJson(filterDateRes);
    assert(filterDateList.some((wo: any) => wo.id === workOrderId), "Date range query returns our work order");

    // 9. Pagination & sorting
    const paginateRes = await fetch(`${API_BASE}/work-orders?limit=1&sort=createdAt&order=desc`);
    assert(paginateRes.status === 200, `GET /api/work-orders?limit=1 returns 200`);
    const paginateList = await getJson(paginateRes);
    assert(paginateList.length <= 1, "Pagination limit matches requested limit");

    // ----------------------------------------------------
    // WORK ORDER SERVICES, PARTS, PAYMENTS, INVOICES TESTS
    // ----------------------------------------------------
    console.log("\n=== Testing WORK ORDER SERVICES ===");
    const wosPayload = {
      workOrderId: workOrderId,
      serviceId: serviceId,
      price: 150000,
      quantity: 2
    };
    const createWosRes = await fetch(`${API_BASE}/work-order-services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(wosPayload)
    });
    assert(createWosRes.status === 201, "POST /api/work-order-services returns 201");
    const createdWos = await getJson(createWosRes);
    const wosId = createdWos.id;
    assert(createdWos.subtotal === 300000, "Calculated subtotal is correct (150000 * 2 = 300000)");

    const getWosRes = await fetch(`${API_BASE}/work-order-services/${wosId}`);
    assert(getWosRes.status === 200, "GET /api/work-order-services/[id] returns 200");
    const wosDetail = await getJson(getWosRes);
    assert(wosDetail.service !== undefined && wosDetail.workOrder !== undefined, "GET details includes service and workOrder relations");

    const patchWosRes = await fetch(`${API_BASE}/work-order-services/${wosId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: 3 })
    });
    assert(patchWosRes.status === 200, "PATCH /api/work-order-services/[id] returns 200");
    const patchedWos = await getJson(patchWosRes);
    assert(patchedWos.subtotal === 450000, "Recalculated subtotal is correct (150000 * 3 = 450000)");

    console.log("\n=== Testing NESTED WORK ORDER SERVICES FLOW ===");
    const nestedWosPayload = {
      serviceId: serviceId,
      quantity: 2
    };
    const createNestedWosRes = await fetch(`${API_BASE}/work-orders/${workOrderId}/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nestedWosPayload)
    });
    assert(createNestedWosRes.status === 201, "POST /api/work-orders/[id]/services returns 201");
    const createdNestedWos = await getJson(createNestedWosRes);
    assert(createdNestedWos.id !== undefined, "Nested WorkOrderService has ID");
    assert(createdNestedWos.subtotal === 300000, "Nested WorkOrderService subtotal is correct");

    // Fetch the work order to verify its total was recalculated
    const verifyWoRes = await fetch(`${API_BASE}/work-orders/${workOrderId}`);
    assert(verifyWoRes.status === 200, "GET /api/work-orders/[id] returns 200");
    const verifyWo = await getJson(verifyWoRes);
    assert(verifyWo.subtotal === 1150000, "Work Order subtotal was recalculated correctly to 1150000");
    assert(verifyWo.grandTotal === 1145000, "Work Order grandTotal was recalculated correctly to 1145000");

    // Test PATCH quantity on service
    const patchNestedWosRes = await fetch(`${API_BASE}/work-orders/${workOrderId}/services/${serviceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: 3 })
    });
    assert(patchNestedWosRes.status === 200, "PATCH /api/work-orders/[id]/services/[serviceId] returns 200");
    const patchedNestedWos = await getJson(patchNestedWosRes);
    assert(patchedNestedWos.quantity === 3, "Nested WorkOrderService quantity updated to 3");
    assert(patchedNestedWos.subtotal === 450000, "Nested WorkOrderService subtotal recalculated to 450000");

    // Verify parent work order total was recalculated
    const verifyWoResAfterPatch = await fetch(`${API_BASE}/work-orders/${workOrderId}`);
    const verifyWoAfterPatch = await getJson(verifyWoResAfterPatch);
    assert(verifyWoAfterPatch.subtotal === 1300000, "Work Order subtotal recalculated to 1300000 after service PATCH");
    assert(verifyWoAfterPatch.grandTotal === 1295000, "Work Order grandTotal recalculated to 1295000 after service PATCH");

    // Test DELETE service from work order
    const deleteNestedWosRes = await fetch(`${API_BASE}/work-orders/${workOrderId}/services/${serviceId}`, {
      method: "DELETE"
    });
    assert(deleteNestedWosRes.status === 200, "DELETE /api/work-orders/[id]/services/[serviceId] returns 200");
    const deletedNestedWos = await getJson(deleteNestedWosRes);
    assert(deletedNestedWos.deletedAt !== null, "Deleted WorkOrderService has deletedAt timestamp set");

    // Fetch the work order to verify total was recalculated
    const verifyWoResAfterDelete = await fetch(`${API_BASE}/work-orders/${workOrderId}`);
    const verifyWoAfterDelete = await getJson(verifyWoResAfterDelete);
    assert(verifyWoAfterDelete.subtotal === 850000, "Work Order subtotal was recalculated correctly to 850000 after delete");
    assert(verifyWoAfterDelete.grandTotal === 845000, "Work Order grandTotal was recalculated correctly to 845000 after delete");

    // Try deleting again, should fail with 404 (since it's already soft deleted)
    const deleteAgainRes = await fetch(`${API_BASE}/work-orders/${workOrderId}/services/${serviceId}`, {
      method: "DELETE"
    });
    assert(deleteAgainRes.status === 404, "DELETE on already deleted service returns 404 Not Found");


    console.log("\n=== Testing WORK ORDER PARTS ===");
    const wopPayload = {
      workOrderId: workOrderId,
      sparePartId: sparePartId,
      price: 250000,
      quantity: 2
    };
    const createWopRes = await fetch(`${API_BASE}/work-order-parts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(wopPayload)
    });
    assert(createWopRes.status === 201, "POST /api/work-order-parts returns 201");
    const createdWop = await getJson(createWopRes);
    const wopId = createdWop.id;
    assert(createdWop.subtotal === 500000, "Calculated subtotal is correct (250000 * 2 = 500000)");

    const getWopRes = await fetch(`${API_BASE}/work-order-parts/${wopId}`);
    assert(getWopRes.status === 200, "GET /api/work-order-parts/[id] returns 200");
    const wopDetail = await getJson(getWopRes);
    assert(wopDetail.sparePart !== undefined && wopDetail.workOrder !== undefined, "GET details includes sparePart and workOrder relations");

    const patchWopRes = await fetch(`${API_BASE}/work-order-parts/${wopId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: 3 })
    });
    assert(patchWopRes.status === 200, "PATCH /api/work-order-parts/[id] returns 200");
    const patchedWop = await getJson(patchWopRes);
    assert(patchedWop.subtotal === 750000, "Recalculated subtotal is correct (250000 * 3 = 750000)");

    console.log("\n=== Testing NESTED WORK ORDER PARTS FLOW ===");
    const nestedWopPayload = {
      sparePartId: sparePartId,
      quantity: 2
    };
    const createNestedWopRes = await fetch(`${API_BASE}/work-orders/${workOrderId}/parts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nestedWopPayload)
    });
    assert(createNestedWopRes.status === 201, "POST /api/work-orders/[id]/parts returns 201");
    const createdNestedWop = await getJson(createNestedWopRes);
    assert(createdNestedWop.id !== undefined, "Nested WorkOrderPart has ID");
    assert(createdNestedWop.subtotal === 500000, "Nested WorkOrderPart subtotal is correct (250000 * 2 = 500000)");

    // Fetch the work order to verify its total was recalculated
    const verifyWoResParts = await fetch(`${API_BASE}/work-orders/${workOrderId}`);
    assert(verifyWoResParts.status === 200, "GET /api/work-orders/[id] returns 200");
    const verifyWoParts = await getJson(verifyWoResParts);
    assert(verifyWoParts.subtotal === 2100000, "Work Order subtotal was recalculated correctly to 2100000");
    assert(verifyWoParts.grandTotal === 2095000, "Work Order grandTotal was recalculated correctly to 2095000");

    // Fetch the spare part to verify its stock was decremented (60 - 2 = 58)
    const getSparePartResForStock = await fetch(`${API_BASE}/spare_parts/${sparePartId}`);
    const sparePartDetailForStock = await getJson(getSparePartResForStock);
    assert(sparePartDetailForStock.stock === 58, "Spare part stock was decremented correctly to 58");

    // Test Insufficient Stock
    const insufficientStockRes = await fetch(`${API_BASE}/work-orders/${workOrderId}/parts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sparePartId: sparePartId, quantity: 100 })
    });
    assert(insufficientStockRes.status === 400, "POST /api/work-orders/[id]/parts with insufficient stock returns 400 Bad Request");

    // Test PATCH quantity on spare part (increase quantity, stock 58 -> 56)
    const patchNestedWopRes = await fetch(`${API_BASE}/work-orders/${workOrderId}/parts/${sparePartId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: 4 })
    });
    assert(patchNestedWopRes.status === 200, "PATCH /api/work-orders/[id]/parts/[sparePartId] (increase) returns 200");
    const patchedNestedWop = await getJson(patchNestedWopRes);
    assert(patchedNestedWop.quantity === 4, "Nested WorkOrderPart quantity updated to 4");
    assert(patchedNestedWop.subtotal === 1000000, "Nested WorkOrderPart subtotal updated to 1000000");

    // Verify parent work order total and stock
    const verifyWoResAfterPatchParts = await fetch(`${API_BASE}/work-orders/${workOrderId}`);
    const verifyWoAfterPatchParts = await getJson(verifyWoResAfterPatchParts);
    assert(verifyWoAfterPatchParts.subtotal === 2600000, "Work Order subtotal recalculated to 2600000 after part increase");
    assert(verifyWoAfterPatchParts.grandTotal === 2595000, "Work Order grandTotal recalculated to 2595000 after part increase");

    const getSparePartResAfterIncrease = await fetch(`${API_BASE}/spare_parts/${sparePartId}`);
    const sparePartAfterIncrease = await getJson(getSparePartResAfterIncrease);
    assert(sparePartAfterIncrease.stock === 56, "Spare part stock decremented to 56");

    // Test PATCH quantity on spare part (decrease quantity, stock 56 -> 59)
    const patchNestedWopDecreaseRes = await fetch(`${API_BASE}/work-orders/${workOrderId}/parts/${sparePartId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: 1 })
    });
    assert(patchNestedWopDecreaseRes.status === 200, "PATCH /api/work-orders/[id]/parts/[sparePartId] (decrease) returns 200");
    const patchedNestedWopDecrease = await getJson(patchNestedWopDecreaseRes);
    assert(patchedNestedWopDecrease.quantity === 1, "Nested WorkOrderPart quantity updated to 1");
    assert(patchedNestedWopDecrease.subtotal === 250000, "Nested WorkOrderPart subtotal updated to 250000");

    // Verify parent work order total and stock
    const verifyWoResAfterDecreaseParts = await fetch(`${API_BASE}/work-orders/${workOrderId}`);
    const verifyWoAfterDecreaseParts = await getJson(verifyWoResAfterDecreaseParts);
    assert(verifyWoAfterDecreaseParts.subtotal === 1850000, "Work Order subtotal recalculated to 1850000 after part decrease");
    assert(verifyWoAfterDecreaseParts.grandTotal === 1845000, "Work Order grandTotal recalculated to 1845000 after part decrease");

    const getSparePartResAfterDecrease = await fetch(`${API_BASE}/spare_parts/${sparePartId}`);
    const sparePartAfterDecrease = await getJson(getSparePartResAfterDecrease);
    assert(sparePartAfterDecrease.stock === 59, "Spare part stock incremented/restored to 59");

    // Test Insufficient Stock on PATCH
    const patchInsufficientRes = await fetch(`${API_BASE}/work-orders/${workOrderId}/parts/${sparePartId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity: 100 })
    });
    assert(patchInsufficientRes.status === 400, "PATCH /api/work-orders/[id]/parts with insufficient stock returns 400 Bad Request");

    // Test DELETE part from work order
    const deleteNestedWopRes = await fetch(`${API_BASE}/work-orders/${workOrderId}/parts/${sparePartId}`, {
      method: "DELETE"
    });
    assert(deleteNestedWopRes.status === 200, "DELETE /api/work-orders/[id]/parts/[sparePartId] returns 200");
    const deletedNestedWop = await getJson(deleteNestedWopRes);
    assert(deletedNestedWop.deletedAt !== null, "Deleted WorkOrderPart has deletedAt timestamp set");

    // Fetch the work order to verify total was recalculated
    const verifyWoResAfterDeleteParts = await fetch(`${API_BASE}/work-orders/${workOrderId}`);
    const verifyWoAfterDeleteParts = await getJson(verifyWoResAfterDeleteParts);
    assert(verifyWoAfterDeleteParts.subtotal === 1600000, "Work Order subtotal was recalculated correctly to 1600000 after delete");
    assert(verifyWoAfterDeleteParts.grandTotal === 1595000, "Work Order grandTotal was recalculated correctly to 1595000 after delete");

    // Fetch spare part to verify stock was restored to 60
    const getSparePartResAfterDeleteStock = await fetch(`${API_BASE}/spare_parts/${sparePartId}`);
    const sparePartDetailAfterDeleteStock = await getJson(getSparePartResAfterDeleteStock);
    assert(sparePartDetailAfterDeleteStock.stock === 60, "Spare part stock was restored correctly back to 60");

    // Try deleting again, should fail with 404 (since it's already soft deleted)
    const deleteAgainResParts = await fetch(`${API_BASE}/work-orders/${workOrderId}/parts/${sparePartId}`, {
      method: "DELETE"
    });
    assert(deleteAgainResParts.status === 404, "DELETE on already deleted part returns 404 Not Found");


    console.log("\n=== Testing PAYMENTS ===");
    const paymentPayload = {
      workOrderId: workOrderId,
      method: "QRIS",
      amount: 395000,
      status: "PAID",
      referenceNumber: `REF-${ts}`
    };
    const createPaymentRes = await fetch(`${API_BASE}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(paymentPayload)
    });
    assert(createPaymentRes.status === 201, "POST /api/payments returns 201");
    const createdPayment = await getJson(createPaymentRes);
    const paymentId = createdPayment.id;

    // Verify parent work order status was automatically updated to COMPLETED (representing PAID effective status)
    const verifyWoResAfterPayment = await fetch(`${API_BASE}/work-orders/${workOrderId}`);
    const verifyWoAfterPayment = await getJson(verifyWoResAfterPayment);
    assert(verifyWoAfterPayment.status === "COMPLETED", "Work Order status was automatically updated to COMPLETED upon PAID payment");
    assert(verifyWoAfterPayment.payment !== null && verifyWoAfterPayment.payment.status === "PAID", "Work Order payment status is PAID");

    const listPaymentsRes = await fetch(`${API_BASE}/payments?workOrderId=${workOrderId}&status=PAID`);
    assert(listPaymentsRes.status === 200, "GET /api/payments returns 200");
    const paymentsList = await getJson(listPaymentsRes);
    assert(paymentsList.some((p: any) => p.id === paymentId), "GET collection returns created payment with filters");

    const getPaymentRes = await fetch(`${API_BASE}/payments/${paymentId}`);
    assert(getPaymentRes.status === 200, "GET /api/payments/[id] returns 200");
    const paymentDetail = await getJson(getPaymentRes);
    assert(paymentDetail.workOrder !== undefined, "GET details includes workOrder relation");

    // Test patching payment status: Create a new work order, add unpaid payment, and update it to PAID
    const tempWoRes = await fetch(`${API_BASE}/work-orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customerId: customerId,
        vehicleId: vehicleId,
        complaint: "Payment patch status test",
      })
    });
    assert(tempWoRes.status === 201, "POST temporary work order for payment patch test returns 201");
    const tempWo = await getJson(tempWoRes);
    const tempWoId = tempWo.id;

    const unpaidPaymentPayload = {
      workOrderId: tempWoId,
      method: "CASH",
      amount: 100000,
      status: "UNPAID",
      referenceNumber: `REF-TEMP-${ts}`
    };
    const createUnpaidPaymentRes = await fetch(`${API_BASE}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(unpaidPaymentPayload)
    });
    assert(createUnpaidPaymentRes.status === 201, "POST unpaid payment returns 201");
    const createdUnpaidPayment = await getJson(createUnpaidPaymentRes);
    const unpaidPaymentId = createdUnpaidPayment.id;

    // Verify temp work order status remains PENDING
    const verifyTempWoRes1 = await fetch(`${API_BASE}/work-orders/${tempWoId}`);
    const verifyTempWo1 = await getJson(verifyTempWoRes1);
    assert(verifyTempWo1.status === "PENDING", "Temporary work order status is PENDING");

    // Patch payment status to PAID
    const patchPaymentStatusRes = await fetch(`${API_BASE}/payments/${unpaidPaymentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID" })
    });
    assert(patchPaymentStatusRes.status === 200, "PATCH payment status to PAID returns 200");

    // Verify temp work order status was updated to COMPLETED
    const verifyTempWoRes2 = await fetch(`${API_BASE}/work-orders/${tempWoId}`);
    const verifyTempWo2 = await getJson(verifyTempWoRes2);
    assert(verifyTempWo2.status === "COMPLETED", "Temporary work order status updated to COMPLETED after payment PATCH to PAID");

    // Cleanup temp payment and work order
    const cleanupTempPaymentRes = await fetch(`${API_BASE}/payments/${unpaidPaymentId}`, {
      method: "DELETE"
    });
    assert(cleanupTempPaymentRes.status === 200, "Delete temporary payment returns 200");

    const cleanupTempWoRes = await fetch(`${API_BASE}/work-orders/${tempWoId}`, {
      method: "DELETE"
    });
    assert(cleanupTempWoRes.status === 200, "Delete temporary work order returns 200");

    const patchPaymentRes = await fetch(`${API_BASE}/payments/${paymentId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: 400000 })
    });
    assert(patchPaymentRes.status === 200, "PATCH /api/payments/[id] returns 200");


    console.log("\n=== Testing INVOICES ===");
    const invoicePayload = {
      workOrderId: workOrderId,
      status: "SENT"
    };
    const createInvoiceRes = await fetch(`${API_BASE}/invoices`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(invoicePayload)
    });
    assert(createInvoiceRes.status === 201, "POST /api/invoices returns 201");
    const createdInvoice = await getJson(createInvoiceRes);
    const invoiceId = createdInvoice.id;
    assert(createdInvoice.invoiceNumber !== undefined, "Created invoice has ID");
    assert(createdInvoice.invoiceNumber.startsWith("INV-"), "Created invoice has code generated starting with INV-");
    
    // Assert summary fields populate correctly
    assert(Array.isArray(createdInvoice.services), "Invoice includes services list");
    assert(Array.isArray(createdInvoice.parts), "Invoice includes spare parts list");
    assert(createdInvoice.subtotal === 1600000, "Invoice subtotal is correct (1600000)");
    assert(createdInvoice.discount === 10000, "Invoice discount is correct (10000)");
    assert(createdInvoice.tax === 5000, "Invoice tax is correct (5000)");
    assert(createdInvoice.grandTotal === 1595000, "Invoice grandTotal is correct (1595000)");
    assert(createdInvoice.paymentStatus === "PAID", "Invoice paymentStatus is PAID");

    const listInvoicesRes = await fetch(`${API_BASE}/invoices?workOrderId=${workOrderId}`);
    assert(listInvoicesRes.status === 200, "GET /api/invoices returns 200");
    const invoicesList = await getJson(listInvoicesRes);
    assert(invoicesList.some((inv: any) => inv.id === invoiceId), "GET collection returns created invoice with filters");

    const getInvoiceRes = await fetch(`${API_BASE}/invoices/${invoiceId}`);
    assert(getInvoiceRes.status === 200, "GET /api/invoices/[id] returns 200");
    const invoiceDetail = await getJson(getInvoiceRes);
    assert(invoiceDetail.workOrder !== undefined && invoiceDetail.payment !== undefined, "GET details includes workOrder and payment relations");
    assert(invoiceDetail.services.length > 0, "GET detail includes services");

    const patchInvoiceRes = await fetch(`${API_BASE}/invoices/${invoiceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAID" })
    });
    assert(patchInvoiceRes.status === 200, "PATCH /api/invoices/[id] returns 200");


    // ----------------------------------------------------
    // CLEANUP / DELETION VIA ENDPOINTS
    // ----------------------------------------------------
    console.log("\n=== Cleaning up created entities via DELETE ===");

    const deleteInvoiceRes = await fetch(`${API_BASE}/invoices/${invoiceId}`, { method: "DELETE" });
    assert(deleteInvoiceRes.status === 200, `DELETE /api/invoices/${invoiceId} returns 200`);

    const deletePaymentRes = await fetch(`${API_BASE}/payments/${paymentId}`, { method: "DELETE" });
    assert(deletePaymentRes.status === 200, `DELETE /api/payments/${paymentId} returns 200`);

    const deleteWopRes = await fetch(`${API_BASE}/work-order-parts/${wopId}`, { method: "DELETE" });
    assert(deleteWopRes.status === 200, `DELETE /api/work-order-parts/${wopId} returns 200`);

    const deleteWosRes = await fetch(`${API_BASE}/work-order-services/${wosId}`, { method: "DELETE" });
    assert(deleteWosRes.status === 200, `DELETE /api/work-order-services/${wosId} returns 200`);

    const deleteWorkOrderRes = await fetch(`${API_BASE}/work-orders/${workOrderId}`, { method: "DELETE" });
    assert(deleteWorkOrderRes.status === 200, `DELETE /api/work-orders/${workOrderId} returns 200`);

    const deleteUserRes = await fetch(`${API_BASE}/users/${userId}`, { method: "DELETE" });
    assert(deleteUserRes.status === 200, `DELETE /api/users/${userId} returns 200`);

    const deletePackageItemRes = await fetch(`${API_BASE}/service_package_items/${packageItemId}`, { method: "DELETE" });
    assert(deletePackageItemRes.status === 200, `DELETE /api/service_package_items/${packageItemId} returns 200`);

    const deletePackageRes = await fetch(`${API_BASE}/service_packages/${packageId}`, { method: "DELETE" });
    assert(deletePackageRes.status === 200, `DELETE /api/service_packages/${packageId} returns 200`);

    const deleteSparePartRes = await fetch(`${API_BASE}/spare_parts/${sparePartId}`, { method: "DELETE" });
    assert(deleteSparePartRes.status === 200, `DELETE /api/spare_parts/${sparePartId} returns 200`);

    const deleteServiceRes = await fetch(`${API_BASE}/services/${serviceId}`, { method: "DELETE" });
    assert(deleteServiceRes.status === 200, `DELETE /api/services/${serviceId} returns 200`);

    const deleteMechanicRes = await fetch(`${API_BASE}/mechanics/${mechanicId}`, { method: "DELETE" });
    assert(deleteMechanicRes.status === 200, `DELETE /api/mechanics/${mechanicId} returns 200`);

    const deleteVehicleRes = await fetch(`${API_BASE}/vehicles/${vehicleId}`, { method: "DELETE" });
    assert(deleteVehicleRes.status === 200, `DELETE /api/vehicles/${vehicleId} returns 200`);

    const deleteCustomerRes = await fetch(`${API_BASE}/customers/${customerId}`, { method: "DELETE" });
    assert(deleteCustomerRes.status === 200, `DELETE /api/customers/${customerId} returns 200`);

    console.log(`\n🎉 Success! Passed all ${passed} assertions.`);
  } catch (error) {
    console.error(`\n❌ Test suite failed with error:`, error);
    process.exit(1);
  }
}

main();
