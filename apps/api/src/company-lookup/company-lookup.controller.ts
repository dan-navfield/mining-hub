import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CompanyLookupService } from './company-lookup.service';

@ApiTags('company-lookup')
@Controller('company-lookup')
export class CompanyLookupController {
  constructor(private readonly companyLookupService: CompanyLookupService) {}

  @Get('abn-search')
  @ApiOperation({ summary: 'Search for company by name using ABN Lookup Web Services' })
  @ApiResponse({ status: 200, description: 'Company data retrieved successfully' })
  @ApiQuery({ name: 'name', required: true, description: 'Company name to search for' })
  async searchByName(@Query('name') name: string) {
    return this.companyLookupService.searchByName(name);
  }

  @Get('abn-details')
  @ApiOperation({ summary: 'Get company details by ABN' })
  @ApiResponse({ status: 200, description: 'Company details retrieved successfully' })
  @ApiQuery({ name: 'abn', required: true, description: 'ABN to lookup' })
  async getByABN(@Query('abn') abn: string) {
    return this.companyLookupService.getByABN(abn);
  }

  @Get('asic-search')
  @ApiOperation({ summary: 'Search ASIC data via data.gov.au' })
  @ApiResponse({ status: 200, description: 'ASIC data retrieved successfully' })
  @ApiQuery({ name: 'name', required: true, description: 'Company name to search for' })
  async searchASIC(@Query('name') name: string) {
    return this.companyLookupService.searchASICData(name);
  }

  @Get('status')
  @ApiOperation({ summary: 'Check company lookup service status' })
  @ApiResponse({ status: 200, description: 'Service status information' })
  async getStatus() {
    const abnConfigured = !!process.env.ABN_LOOKUP_GUID;
    const openCorporatesConfigured = !!process.env.OPENCORPORATES_API_KEY;
    
    return {
      status: 'ready',
      dataSources: {
        abnLookup: {
          configured: abnConfigured,
          status: abnConfigured ? 'ready' : 'waiting for GUID',
          note: abnConfigured ? 'Real ABN data available' : 'Register at https://abr.business.gov.au/Tools/WebServices'
        },
        asicData: {
          configured: true,
          status: 'ready (mock data)',
          note: 'Using mock data for demo - real ASIC CSV integration ready'
        },
        openCorporates: {
          configured: openCorporatesConfigured,
          status: openCorporatesConfigured ? 'ready' : 'optional',
          note: 'International company data (optional)'
        }
      },
      realABNsAvailable: ['BHP GROUP LIMITED', 'RIO TINTO LIMITED', 'FORTESCUE METALS GROUP LTD', 'NEWCREST MINING LIMITED'],
      nextSteps: abnConfigured ? 
        ['Test real ABN lookup', 'All systems operational'] : 
        ['Wait for ABR GUID approval', 'Add GUID to .env file', 'Restart API server']
    };
  }
}
