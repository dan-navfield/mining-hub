// Export all types
export * from './shire-rates';

// Placeholder for other types that might be referenced
export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Tenement {
  id: string;
  jurisdiction: string;
  number: string;
  type: string;
  status: string;
  holder_name?: string;
  expiry_date?: string;
  area_ha?: number;
  last_sync_at?: string;
}

export interface Action {
  id: string;
  title: string;
  description?: string;
  status: string;
  dueDate?: Date | string;
  tenementId?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

// WA Tenement types (from wa-mto.service.ts)
export type TenementType = 'ML' | 'EL' | 'PL' | 'GL' | 'RL' | 'MPL' | 'SML' | 'EPL' | 'CML' | 'Other';
export type TenementStatus = 'Live' | 'Pending' | 'Granted' | 'Expired' | 'Surrendered' | 'Forfeited' | 'Withdrawn' | 'Refused' | 'Cancelled' | 'Suspended' | 'Other';

export interface WATenement {
  oid: number;
  gid: number;
  tenid: string;
  type: TenementType;
  name: string;
  fmt_tenid: string;
  status: TenementStatus;
  statusDate: Date;
  survstatus: string;
  holdercnt: number;
  holder1: string;
  addr1?: string;
  holder2?: string;
  addr2?: string;
  holder3?: string;
  addr3?: string;
  holder4?: string;
  addr4?: string;
  holder5?: string;
  addr5?: string;
  holder6?: string;
  addr6?: string;
  holder7?: string;
  addr7?: string;
  holder8?: string;
  addr8?: string;
  holder9?: string;
  addr9?: string;
  extract_da: Date;
  grantdate?: Date;
  granttime?: string;
  startdate?: Date;
  starttime?: string;
  enddate?: Date;
  endtime?: string;
  legal_area: number;
  unit_of_me: string;
  st_area_geom: number;
  st_perimeter_geom: number;
  special_in?: string;
  geometry: any;
  centroid?: { latitude: number; longitude: number };
  mineralField?: string;
  localGovernment?: string;
  rentDue?: number;
  expenditureCommitment?: number;
  lastUpdated: Date;
  sourceId: string;
  holder: string;
  holderAddress?: string;
  area: number;
  applicationDate?: Date;
  grantDate?: Date;
  expiryDate?: Date;
}

export interface TenementSearchParams {
  holder?: string;
  type?: TenementType[];
  status?: TenementStatus[];
  mineralField?: string;
  areaMin?: number;
  areaMax?: number;
  expiryDateFrom?: Date;
  expiryDateTo?: Date;
  bbox?: [number, number, number, number];
  limit?: number;
  offset?: number;
}

export interface TenementSearchResult {
  tenements: WATenement[];
  total: number;
  hasMore: boolean;
}

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Query types
export interface TenementQuery {
  search?: string;
  jurisdiction?: string;
  status?: string;
  type?: string;
  page?: number;
  limit?: number;
}

export interface ActionQuery {
  search?: string;
  status?: string;
  tenementId?: string;
  page?: number;
  limit?: number;
}

// Request types
export interface CreateTenementRequest {
  jurisdiction: string;
  number: string;
  type: string;
  status: string;
  holder_name?: string;
  expiry_date?: string;
  area_ha?: number;
}

export interface UpdateTenementRequest {
  type?: string;
  status?: string;
  holder_name?: string;
  expiry_date?: string;
  area_ha?: number;
}

export interface CreateActionRequest {
  title: string;
  description?: string;
  status: string;
  dueDate?: Date | string;
  tenementId?: string;
}

export interface UpdateActionRequest {
  title?: string;
  description?: string;
  status?: string;
  dueDate?: Date | string;
}

export interface BulkUpdateActionsRequest {
  actionIds: string[];
  updates: UpdateActionRequest;
}

// WA API Response types
export interface WATenementProperties {
  oid: number;
  gid: number;
  tenid: string;
  type: string;
  name: string;
  fmt_tenid: string;
  status: string;
  statusDate: string;
  survstatus: string;
  holdercnt: number;
  holder1: string;
  addr1?: string;
  holder2?: string;
  addr2?: string;
  holder3?: string;
  addr3?: string;
  holder4?: string;
  addr4?: string;
  holder5?: string;
  addr5?: string;
  holder6?: string;
  addr6?: string;
  holder7?: string;
  addr7?: string;
  holder8?: string;
  addr8?: string;
  holder9?: string;
  addr9?: string;
  extract_da: string;
  grantdate?: string;
  granttime?: string;
  startdate?: string;
  starttime?: string;
  enddate?: string;
  endtime?: string;
  legal_area: number;
  unit_of_me: string;
  st_area_geom: number;
  st_perimeter_geom: number;
  special_in?: string;
}

export interface WATenementFeature {
  attributes: WATenementProperties;
  geometry?: any;
}

export interface WATenementAPIResponse {
  features: WATenementFeature[];
  exceededTransferLimit?: boolean;
}

// Action types for status badges
export type ActionStatus = 'Open' | 'Snoozed' | 'Done' | 'Cancelled';
export type ActionType = 'Anniversary' | 'RentDue' | 'Section29' | 'AdHoc';
