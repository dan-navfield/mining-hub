import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { TenementsService } from './tenements.service';

@ApiTags('tenements')
@Controller('tenements')
export class TenementsController {
  constructor(private readonly tenementsService: TenementsService) {}

  @Get()
  @ApiOperation({ summary: 'Get tenements with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Tenements retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 50, max: 200)' })
  @ApiQuery({ name: 'jurisdiction', required: false, description: 'Filter by jurisdiction (WA, NSW, VIC, NT, QLD)' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by status' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by tenement type' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in number or holder name' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field (default: last_sync_at)' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order: asc or desc (default: desc)' })
  async findAll(@Query() query: any) {
    return this.tenementsService.findMany(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get tenement statistics by jurisdiction' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats() {
    return this.tenementsService.getStatsByJurisdiction();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get tenement by ID' })
  @ApiResponse({ status: 200, description: 'Tenement retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Tenement not found' })
  async findOne(@Param('id') id: string) {
    return this.tenementsService.findOne(id);
  }
}
