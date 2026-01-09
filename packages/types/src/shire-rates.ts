// Shire Rates Types
export interface ShireRates {
  id: string;
  
  // Document information
  documentName: string;
  documentType: 'pdf' | 'doc' | 'docx' | 'image';
  documentUrl?: string;
  documentSizeBytes?: number;
  
  // OCR and processing
  ocrStatus: 'pending' | 'processing' | 'completed' | 'failed';
  ocrConfidence?: number;
  rawOcrText?: string;
  
  // Parsed shire rates data
  shireName?: string;
  propertyAddress?: string;
  propertyDescription?: string;
  assessmentNumber?: string;
  propertyOwner?: string;
  
  // Financial information
  landValue?: number;
  capitalImprovedValue?: number;
  annualValue?: number;
  
  // Rates breakdown
  generalRates?: number;
  waterRates?: number;
  sewerageRates?: number;
  garbageRates?: number;
  otherCharges?: number;
  totalRates?: number;
  
  // Payment information
  dueDate?: Date | string;
  paymentDate?: Date | string;
  paymentStatus: 'unpaid' | 'paid' | 'overdue' | 'partial';
  paymentMethod?: string;
  
  // Period information
  ratingPeriodStart?: Date | string;
  ratingPeriodEnd?: Date | string;
  financialYear?: string;
  
  // Client and property association
  clientName?: string;
  clientId?: string;
  tenementId?: string;
  propertyReference?: string;
  
  // Action/workflow association
  actionId?: string;
  
  // Metadata
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  
  // Additional fields
  notes?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface CreateShireRatesRequest {
  documentName: string;
  documentType: 'pdf' | 'doc' | 'docx' | 'image';
  documentUrl?: string;
  documentSizeBytes?: number;
  clientName?: string;
  tenementId?: string;
  propertyReference?: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateShireRatesRequest {
  // Parsed data updates
  shireName?: string;
  propertyAddress?: string;
  propertyDescription?: string;
  assessmentNumber?: string;
  propertyOwner?: string;
  
  // Financial information
  landValue?: number;
  capitalImprovedValue?: number;
  annualValue?: number;
  
  // Rates breakdown
  generalRates?: number;
  waterRates?: number;
  sewerageRates?: number;
  garbageRates?: number;
  otherCharges?: number;
  totalRates?: number;
  
  // Payment information
  dueDate?: Date | string;
  paymentDate?: Date | string;
  paymentStatus?: 'unpaid' | 'paid' | 'overdue' | 'partial';
  paymentMethod?: string;
  
  // Period information
  ratingPeriodStart?: Date | string;
  ratingPeriodEnd?: Date | string;
  financialYear?: string;
  
  // Client and property association
  clientName?: string;
  clientId?: string;
  tenementId?: string;
  propertyReference?: string;
  
  // Additional fields
  notes?: string;
  tags?: string[];
  metadata?: Record<string, any>;
}

export interface ShireRatesQuery {
  clientName?: string;
  shireName?: string;
  paymentStatus?: 'unpaid' | 'paid' | 'overdue' | 'partial';
  financialYear?: string;
  dueDateFrom?: Date | string;
  dueDateTo?: Date | string;
  tags?: string[];
  search?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'dueDate' | 'createdAt' | 'totalRates' | 'shireName';
  sortOrder?: 'asc' | 'desc';
}

export interface ShireRatesStats {
  total: number;
  byPaymentStatus: Record<string, number>;
  byShire: Record<string, number>;
  byFinancialYear: Record<string, number>;
  totalValue: number;
  averageValue: number;
  upcomingDue: number;
  overdue: number;
}

export interface OCRResult {
  text: string;
  confidence: number;
  extractedData: Partial<ShireRates>;
  rawFields: Array<{
    field: string;
    value: string;
    confidence: number;
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
}

export interface FileUploadProgress {
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  result?: ShireRates;
}

// Utility types for forms and components
export type ShireRatesFormData = Omit<CreateShireRatesRequest, 'documentUrl' | 'documentSizeBytes'> & {
  file?: File;
};

export type ShireRatesTableRow = ShireRates & {
  isSelected?: boolean;
  isExpanded?: boolean;
};
