import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { ShireRatesService } from './shire-rates.service';
import { OCRService } from './ocr.service';
import { FileUploadService } from './file-upload.service';
import {
  ShireRates,
  CreateShireRatesRequest,
  UpdateShireRatesRequest,
  ShireRatesQuery,
  ShireRatesStats,
} from '@mining-hub/types';
import { diskStorage } from 'multer';
import { extname } from 'path';

@ApiTags('shire-rates')
@Controller('shire-rates')
// @UseGuards(JwtAuthGuard) // TODO: Add authentication
// @ApiBearerAuth()
export class ShireRatesController {
  constructor(
    private readonly shireRatesService: ShireRatesService,
    private readonly ocrService: OCRService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload and process shire rates document' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Document uploaded and processing started' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/shire-rates',
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/png',
          'image/tiff',
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type. Only PDF, DOC, DOCX, and images are allowed.'), false);
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
    }),
  )
  async uploadDocument(
    @UploadedFile() file: any, // Express.Multer.File
    @Body() body: any,
    @Request() req: any,
  ): Promise<ShireRates> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const userId = req.user?.id || 'anonymous'; // TODO: Get from auth

    try {
      // Upload file to Supabase storage
      const documentUrl = await this.fileUploadService.uploadFile(file, userId);

      // Create initial record
      const createData: CreateShireRatesRequest = {
        documentName: file.originalname,
        documentType: this.getDocumentType(file.mimetype),
        documentUrl,
        documentSizeBytes: file.size,
        clientName: body.clientName,
        tenementId: body.tenementId,
        propertyReference: body.propertyReference,
        notes: body.notes,
        tags: body.tags ? JSON.parse(body.tags) : [],
      };

      const shireRates = await this.shireRatesService.create(createData, userId);

      // Start OCR processing asynchronously
      this.processDocumentAsync(shireRates.id, file.path, file.mimetype);

      return shireRates;
    } catch (error) {
      // Clean up uploaded file if database operation fails
      if (file.path) {
        await this.fileUploadService.deleteLocalFile(file.path);
      }
      throw error;
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all shire rates records' })
  @ApiResponse({ status: 200, description: 'List of shire rates records' })
  async findAll(
    @Query() query: ShireRatesQuery,
    @Request() req: any,
  ): Promise<{ data: ShireRates[]; total: number }> {
    const userId = req.user?.id || 'anonymous'; // TODO: Get from auth
    return this.shireRatesService.findAll(query, userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get shire rates statistics' })
  @ApiResponse({ status: 200, description: 'Shire rates statistics' })
  async getStats(@Request() req: any): Promise<ShireRatesStats> {
    const userId = req.user?.id || 'anonymous'; // TODO: Get from auth
    return this.shireRatesService.getStats(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shire rates record by ID' })
  @ApiResponse({ status: 200, description: 'Shire rates record found' })
  @ApiResponse({ status: 404, description: 'Shire rates record not found' })
  async findOne(@Param('id') id: string, @Request() req: any): Promise<ShireRates> {
    const userId = req.user?.id || 'anonymous'; // TODO: Get from auth
    return this.shireRatesService.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update shire rates record' })
  @ApiResponse({ status: 200, description: 'Shire rates record updated' })
  @ApiResponse({ status: 404, description: 'Shire rates record not found' })
  async update(
    @Param('id') id: string,
    @Body() updateData: UpdateShireRatesRequest,
    @Request() req: any,
  ): Promise<ShireRates> {
    const userId = req.user?.id || 'anonymous'; // TODO: Get from auth
    return this.shireRatesService.update(id, updateData, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete shire rates record' })
  @ApiResponse({ status: 200, description: 'Shire rates record deleted' })
  @ApiResponse({ status: 404, description: 'Shire rates record not found' })
  async remove(@Param('id') id: string, @Request() req: any): Promise<void> {
    const userId = req.user?.id || 'anonymous'; // TODO: Get from auth
    await this.shireRatesService.remove(id, userId);
  }

  @Post(':id/reprocess')
  @ApiOperation({ summary: 'Reprocess OCR for a document' })
  @ApiResponse({ status: 200, description: 'OCR reprocessing started' })
  async reprocessOCR(@Param('id') id: string, @Request() req: any): Promise<{ message: string }> {
    const userId = req.user?.id || 'anonymous'; // TODO: Get from auth
    const shireRates = await this.shireRatesService.findOne(id, userId);
    
    if (!shireRates.documentUrl) {
      throw new BadRequestException('No document URL found for reprocessing');
    }

    // Download file from storage and reprocess
    const localPath = await this.fileUploadService.downloadFile(shireRates.documentUrl);
    this.processDocumentAsync(id, localPath, shireRates.documentType);

    return { message: 'OCR reprocessing started' };
  }

  private async processDocumentAsync(recordId: string, filePath: string, mimeType: string): Promise<void> {
    try {
      // Update status to processing
      await this.shireRatesService.updateOCRStatus(recordId, 'processing');

      // Process with OCR
      const ocrResult = await this.ocrService.processDocument(filePath, mimeType);

      // Update record with OCR results
      await this.shireRatesService.updateWithOCRData(recordId, ocrResult);

      // Clean up local file
      await this.fileUploadService.deleteLocalFile(filePath);
    } catch (error) {
      console.error('Error processing document:', error);
      
      // Update status to failed
      await this.shireRatesService.updateOCRStatus(recordId, 'failed');
      
      // Clean up local file
      await this.fileUploadService.deleteLocalFile(filePath);
    }
  }

  private getDocumentType(mimeType: string): 'pdf' | 'doc' | 'docx' | 'image' {
    if (mimeType === 'application/pdf') return 'pdf';
    if (mimeType === 'application/msword') return 'doc';
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
    if (mimeType.startsWith('image/')) return 'image';
    return 'pdf'; // default
  }
}
