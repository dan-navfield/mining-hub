import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ActionsService } from './actions.service';
import { CreateActionDto, UpdateActionDto, ActionFiltersDto } from './dto/actions.dto';

@Controller('actions')
export class ActionsController {
  constructor(private readonly actionsService: ActionsService) {}

  @Get()
  async findAll(@Query() filters: ActionFiltersDto) {
    try {
      return await this.actionsService.findAll(filters);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch actions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('upcoming')
  async getUpcoming(@Query('days') days?: number) {
    try {
      return await this.actionsService.getUpcoming(days || 30);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch upcoming actions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('overdue')
  async getOverdue() {
    try {
      return await this.actionsService.getOverdue();
    } catch (error) {
      throw new HttpException(
        'Failed to fetch overdue actions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('stats')
  async getStats(@Query('jurisdiction') jurisdiction?: string) {
    try {
      return await this.actionsService.getStats(jurisdiction);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch action statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('tenement/:tenementId')
  async findByTenement(@Param('tenementId') tenementId: string) {
    try {
      return await this.actionsService.findByTenement(tenementId);
    } catch (error) {
      throw new HttpException(
        'Failed to fetch tenement actions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const action = await this.actionsService.findOne(id);
      if (!action) {
        throw new HttpException('Action not found', HttpStatus.NOT_FOUND);
      }
      return action;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to fetch action',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post()
  async create(@Body() createActionDto: CreateActionDto) {
    try {
      return await this.actionsService.create(createActionDto);
    } catch (error) {
      throw new HttpException(
        'Failed to create action',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateActionDto: UpdateActionDto) {
    try {
      const action = await this.actionsService.update(id, updateActionDto);
      if (!action) {
        throw new HttpException('Action not found', HttpStatus.NOT_FOUND);
      }
      return action;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to update action',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put(':id/complete')
  async complete(@Param('id') id: string, @Body('completedDate') completedDate?: string) {
    try {
      const action = await this.actionsService.markComplete(id, completedDate);
      if (!action) {
        throw new HttpException('Action not found', HttpStatus.NOT_FOUND);
      }
      return action;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to complete action',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    try {
      const result = await this.actionsService.remove(id);
      if (!result) {
        throw new HttpException('Action not found', HttpStatus.NOT_FOUND);
      }
      return { message: 'Action deleted successfully' };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to delete action',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
