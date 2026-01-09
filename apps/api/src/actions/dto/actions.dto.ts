import { IsString, IsOptional, IsDateString, IsNumber, IsEnum, IsArray, IsUUID, Min, Max } from 'class-validator';

export enum ActionType {
  RENEWAL = 'renewal',
  PAYMENT = 'payment',
  EXPENDITURE = 'expenditure',
  REPORTING = 'reporting',
  COMPLIANCE = 'compliance',
  SHIRE_RATES = 'shire_rates',
  OBJECTION = 'objection',
  CUSTOM = 'custom',
}

export enum ActionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

export enum RecurrenceInterval {
  NONE = 'none',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  ANNUALLY = 'annually',
}

export class CreateActionDto {
  @IsOptional()
  @IsUUID()
  tenement_id?: string;

  @IsString()
  tenement_number: string;

  @IsString()
  jurisdiction: string;

  @IsString()
  action_name: string;

  @IsEnum(ActionType)
  action_type: ActionType;

  @IsDateString()
  due_date: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsEnum(RecurrenceInterval)
  recurrence_interval?: RecurrenceInterval;

  @IsOptional()
  @IsDateString()
  recurrence_end_date?: string;

  @IsOptional()
  @IsUUID()
  parent_action_id?: string;

  @IsOptional()
  @IsString()
  data_source?: string;

  @IsOptional()
  @IsString()
  external_reference?: string;
}

export class UpdateActionDto {
  @IsOptional()
  @IsString()
  action_name?: string;

  @IsOptional()
  @IsEnum(ActionType)
  action_type?: ActionType;

  @IsOptional()
  @IsEnum(ActionStatus)
  status?: ActionStatus;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsDateString()
  completed_date?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsEnum(RecurrenceInterval)
  recurrence_interval?: RecurrenceInterval;

  @IsOptional()
  @IsDateString()
  recurrence_end_date?: string;

  @IsOptional()
  @IsString()
  external_reference?: string;
}

export class ActionFiltersDto {
  @IsOptional()
  @IsString()
  jurisdiction?: string;

  @IsOptional()
  @IsEnum(ActionType)
  action_type?: ActionType;

  @IsOptional()
  @IsEnum(ActionStatus)
  status?: ActionStatus;

  @IsOptional()
  @IsString()
  tenement_number?: string;

  @IsOptional()
  @IsDateString()
  due_date_from?: string;

  @IsOptional()
  @IsDateString()
  due_date_to?: string;

  @IsOptional()
  @IsString()
  data_source?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(1000)
  limit?: number;

  @IsOptional()
  @IsString()
  sort_by?: string;

  @IsOptional()
  @IsString()
  sort_order?: 'asc' | 'desc';
}
