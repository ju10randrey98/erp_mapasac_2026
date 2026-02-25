import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';

import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { PermissionsGuard } from './auth/permissions.guard';
import { MustChangePasswordGuard } from './auth/must-change-password.guard';

import { ClientsModule } from './clients/clients.module';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';

import { RolesModule } from './roles/roles.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,

    // módulos negocio
    ClientsModule,
    ProductsModule,
    InventoryModule,

    // ✅ roles (para GET /roles y luego CRUD)
    RolesModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,

    // Guards globales (orden correcto)
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: MustChangePasswordGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
  ],
})
export class AppModule {}
