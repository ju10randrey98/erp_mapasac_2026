import * as bcrypt from "bcrypt";
import { PrismaClient, permissions as PermissionModel, roles as RoleModel } from "@prisma/client";

const prisma = new PrismaClient();

type RoleName =
  | "ADMIN"
  | "GERENCIA"
  | "CONTABILIDAD"
  | "ALMACEN"
  | "VENTAS"
  | "COMPRAS"
  | "RRHH"
  | "SOPORTE_TI";

async function upsertRole(name: RoleName, description: string) {
  return prisma.roles.upsert({
    where: { name },
    update: { description },
    create: { name, description },
  });
}

async function upsertPermission(code: string, description?: string) {
  return prisma.permissions.upsert({
    where: { code },
    update: { description: description ?? code },
    create: { code, description: description ?? code },
  });
}

async function grantRolePermissions(role: RoleModel, permissions: PermissionModel[]) {
  for (const p of permissions) {
    await prisma.role_permissions.upsert({
      where: {
        role_id_permission_id: { role_id: role.id, permission_id: p.id },
      },
      update: {},
      create: { role_id: role.id, permission_id: p.id },
    });
  }
}

async function main() {
  // -------------------------
  // 1) Roles base (ERP real)
  // -------------------------
  const rolesToCreate: Array<{ name: RoleName; description: string }> = [
    { name: "ADMIN", description: "Administrador del sistema" },
    { name: "GERENCIA", description: "Gerencia / Dirección (lectura y reportes)" },
    { name: "CONTABILIDAD", description: "Contabilidad / Finanzas" },
    { name: "ALMACEN", description: "Almacén / Inventario" },
    { name: "VENTAS", description: "Ventas / Comercial" },
    { name: "COMPRAS", description: "Compras / Abastecimiento" },
    { name: "RRHH", description: "Recursos Humanos" },
    { name: "SOPORTE_TI", description: "Soporte TI (seguridad y auditoría)" },
  ];

  const roleMap = new Map<RoleName, RoleModel>();
  for (const r of rolesToCreate) {
    const role = await upsertRole(r.name, r.description);
    roleMap.set(r.name, role);
  }

  // -------------------------
  // 2) Permisos base (ERP)
  // -------------------------
  // Patrón recomendado: modulo.accion
  const permissionCodes = [
    // Seguridad
    "users.read",
    "users.create",
    "users.update",
    "users.delete",

    "roles.read",
    "roles.create",
    "roles.update",
    "roles.delete",

    "permissions.read",

    "audit.read",

    // Clientes
    "clients.read",
    "clients.create",
    "clients.update",
    "clients.delete",

    // Productos
    "products.read",
    "products.create",
    "products.update",
    "products.delete",

    // Inventario / Almacén
    "warehouses.read",
    "warehouses.create",
    "warehouses.update",
    "warehouses.delete",

    "inventory.read",
    "inventory.move", // movimientos (entradas/salidas/transferencias)
    "inventory.adjust", // ajustes (inventario físico)

    // Futuro: ventas/compras (cuando implementes módulos)
    "sales.read",
    "sales.create",
    "sales.update",
    "sales.delete",

    "purchases.read",
    "purchases.create",
    "purchases.update",
    "purchases.delete",

    // Futuro: RRHH
    "hr.read",
    "hr.create",
    "hr.update",
    "hr.delete",
  ];

  const permissions: PermissionModel[] = [];
  for (const code of permissionCodes) {
    const p = await upsertPermission(code, code);
    permissions.push(p);
  }

  const byCode = (codes: string[]) => {
    const set = new Set(codes);
    return permissions.filter((p) => set.has(p.code));
  };

  // -------------------------
  // 3) Matriz de permisos por rol
  // -------------------------
  // ADMIN: todo
  await grantRolePermissions(roleMap.get("ADMIN")!, permissions);

  // GERENCIA: lectura de todo + auditoría
  await grantRolePermissions(
    roleMap.get("GERENCIA")!,
    byCode([
      "users.read",
      "roles.read",
      "permissions.read",
      "audit.read",

      "clients.read",
      "products.read",
      "warehouses.read",
      "inventory.read",

      "sales.read",
      "purchases.read",
      "hr.read",
    ])
  );

  // CONTABILIDAD: clientes + ventas/compras + lectura inventario
  await grantRolePermissions(
    roleMap.get("CONTABILIDAD")!,
    byCode([
      "clients.read",
      "clients.create",
      "clients.update",

      "sales.read",
      "sales.create",
      "sales.update",

      "purchases.read",
      "purchases.create",
      "purchases.update",

      "products.read",
      "inventory.read",
      "warehouses.read",
    ])
  );

  // ALMACEN: productos + inventario + almacenes (y movimientos)
  await grantRolePermissions(
    roleMap.get("ALMACEN")!,
    byCode([
      "products.read",
      "products.create",
      "products.update",

      "warehouses.read",
      "warehouses.create",
      "warehouses.update",

      "inventory.read",
      "inventory.move",
      "inventory.adjust",
    ])
  );

  // VENTAS: clientes + ventas + lectura productos/stock
  await grantRolePermissions(
    roleMap.get("VENTAS")!,
    byCode([
      "clients.read",
      "clients.create",
      "clients.update",

      "sales.read",
      "sales.create",
      "sales.update",

      "products.read",
      "inventory.read",
      "warehouses.read",
    ])
  );

  // COMPRAS: compras + lectura productos/almacenes + (futuro ingreso a inventario via movimientos)
  await grantRolePermissions(
    roleMap.get("COMPRAS")!,
    byCode([
      "purchases.read",
      "purchases.create",
      "purchases.update",

      "products.read",
      "warehouses.read",
      "inventory.read",
      "inventory.move",
    ])
  );

  // RRHH: módulo RRHH (futuro)
  await grantRolePermissions(
    roleMap.get("RRHH")!,
    byCode(["hr.read", "hr.create", "hr.update"])
  );

  // SOPORTE_TI: seguridad + auditoría (sin módulos de negocio)
  await grantRolePermissions(
    roleMap.get("SOPORTE_TI")!,
    byCode([
      "users.read",
      "users.create",
      "users.update",

      "roles.read",
      "roles.create",
      "roles.update",

      "permissions.read",
      "audit.read",
    ])
  );

  // -------------------------
  // 4) Usuario admin
  // -------------------------
  const adminPassword = "Admin123*"; // cámbiala luego
  const password_hash = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.users.upsert({
    where: { username: "admin" },
    update: {
      email: "admin@erp.local",
      password_hash,
      is_active: true,
      must_change_password: false,
      failed_attempts: 0,
      locked_until: null,
    },
    create: {
      username: "admin",
      email: "admin@erp.local",
      full_name: "Administrador",
      password_hash,
      is_active: true,
      must_change_password: false,
      failed_attempts: 0,
    },
  });

  // Vincular admin con rol ADMIN
  await prisma.user_roles.upsert({
    where: {
      user_id_role_id: { user_id: adminUser.id, role_id: roleMap.get("ADMIN")!.id },
    },
    update: {},
    create: { user_id: adminUser.id, role_id: roleMap.get("ADMIN")!.id },
  });

  console.log("✅ Seed completado");
  console.log("ADMIN:", adminUser.username, "PASS:", adminPassword);
  console.log("Roles creados:", rolesToCreate.map((r) => r.name).join(", "));
  console.log("Permisos creados:", permissions.length);
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });