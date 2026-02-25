import { Controller, Get } from '@nestjs/common';
import { RolesService } from './roles.service';
import { Roles } from '../auth/roles.decorator';
import { Permissions } from '../auth/permissions.decorator';

@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Roles('ADMIN')
  @Permissions('users.create')
  @Get()
  async findAll() {
    return this.rolesService.findAll();
  }
}