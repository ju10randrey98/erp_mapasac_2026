import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { Roles } from '../auth/roles.decorator';
import { Permissions } from '../auth/permissions.decorator';
import { CreateUserDto } from './dto/create-user.dto';
import { ToggleActiveDto } from './dto/toggle-active.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles('ADMIN')
  @Permissions('users.read')
  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('q') q?: string,
    @Query('is_active') is_active?: string,
  ) {
    const parsedIsActive =
      is_active === 'true' || is_active === 'false'
        ? (is_active as 'true' | 'false')
        : undefined;

    return this.usersService.findAllPaginated({
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 10,
      q,
      is_active: parsedIsActive,
    });
  }

  // 🔹 CREATE USER (auditoría correcta)
  @Roles('ADMIN')
  @Permissions('users.create')
  @Post()
  async create(@Body() dto: CreateUserDto, @Req() req: any) {
    const actorId = req.user?.sub;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];

    return this.usersService.createUser(dto, actorId, ip, userAgent);
  }

  @Roles('ADMIN')
  @Permissions('users.read')
  @Get(':username')
  async byUsername(@Param('username') username: string) {
    const user = await this.usersService.findByUsername(username);
    if (!user) return null;

    const { password_hash, ...safe } = user as any;
    return safe;
  }

  @Roles('ADMIN')
  @Permissions('users.update')
  @Patch(':id/active')
  async setActive(
    @Param('id') id: string,
    @Body() dto: ToggleActiveDto,
    @Req() req: any,
  ) {
    const actorId = req.user?.sub;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];

    return this.usersService.setActive(id, dto.is_active, actorId, ip, userAgent);
  }

  @Roles('ADMIN')
  @Permissions('users.update')
  @Patch(':id/unlock')
  async unlock(@Param('id') id: string, @Req() req: any) {
    const actorId = req.user?.sub;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];

    return this.usersService.unlockUser(id, actorId, ip, userAgent);
  }

  @Roles('ADMIN')
  @Permissions('users.update')
  @Post(':id/reset-password')
  async resetPassword(
    @Param('id') id: string,
    @Body() dto: ResetPasswordDto,
    @Req() req: any,
  ) {
    const actorId = req.user?.sub;
    const ip = req.ip;
    const userAgent = req.headers['user-agent'];

    return this.usersService.resetPassword(
      id,
      dto.must_change_password ?? true,
      actorId,
      ip,
      userAgent,
    );
  }
}