import { Controller, Get, Post, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { DataSourcesService } from './data-sources.service';

@ApiTags('data-sources')
@Controller('data-sources')
export class DataSourcesController {
  constructor(private readonly dataSourcesService: DataSourcesService) {}

  @Get()
  async getAllDataSources() {
    return this.dataSourcesService.getAllDataSources();
  }

  @Get('jurisdiction/:jurisdiction')
  async getDataSourcesByJurisdiction(@Param('jurisdiction') jurisdiction: string) {
    return this.dataSourcesService.getDataSourcesByJurisdiction(jurisdiction);
  }

  @Get('status/check')
  async checkAllDataSourcesStatus() {
    return this.dataSourcesService.checkAllDataSourcesStatus();
  }

  @Post('sync/:jurisdiction')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Sync data from a specific jurisdiction' })
  @ApiResponse({ status: 200, description: 'Sync completed successfully' })
  async syncDataSource(@Param('jurisdiction') jurisdiction: string) {
    return this.dataSourcesService.syncDataSource(jurisdiction);
  }

  @Get('tenements/stats')
  @ApiOperation({ summary: 'Get tenement statistics by jurisdiction' })
  @ApiResponse({ status: 200, description: 'Statistics retrieved successfully' })
  async getTenementStats() {
    return this.dataSourcesService.getTenementStats();
  }
}
