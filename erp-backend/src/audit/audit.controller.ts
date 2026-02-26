import { Controller, Get, Query } from '@nestjs/common';
import { AuditService } from './audit.service';
import { Permissions } from '../auth/permissions.decorator';
import { QueryAuditDto } from './dto/query-audit.dto';

@Controller('audit-logs')
export class AuditController {
  constructor(private readonly audit: AuditService) {}

  @Permissions('audit.read')
  @Get()
  async list(@Query() query: QueryAuditDto) {
    return this.audit.findAllPaginated(query);
  }
}