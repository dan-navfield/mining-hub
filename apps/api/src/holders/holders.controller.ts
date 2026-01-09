import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { HoldersService } from './holders.service';

@ApiTags('holders')
@Controller('holders')
export class HoldersController {
  constructor(private readonly holdersService: HoldersService) {}

  @Get()
  @ApiOperation({ summary: 'Get holders with aggregated tenement data, filtering and pagination' })
  @ApiResponse({ status: 200, description: 'Holders retrieved successfully' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'search', required: false, description: 'Search in holder name' })
  @ApiQuery({ name: 'jurisdiction', required: false, description: 'Filter by jurisdiction (WA, NSW, VIC, NT, QLD, TAS)' })
  @ApiQuery({ name: 'minTenements', required: false, description: 'Minimum number of tenements' })
  @ApiQuery({ name: 'maxTenements', required: false, description: 'Maximum number of tenements' })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field (name, totalTenements, totalValue)' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order: asc or desc (default: desc)' })
  async findAll(@Query() query: any) {
    return this.holdersService.findMany(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get holder statistics' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getStats() {
    return this.holdersService.getStats();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get holder by slug with detailed information' })
  @ApiResponse({ status: 200, description: 'Holder retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Holder not found' })
  async findOne(@Param('slug') slug: string) {
    return this.holdersService.findOneBySlug(slug);
  }
}
