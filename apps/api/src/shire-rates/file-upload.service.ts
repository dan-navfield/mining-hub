import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);

  constructor(private supabase: SupabaseService) {}

  async uploadFile(file: any, userId: string): Promise<string> { // Express.Multer.File
    try {
      const fileExtension = path.extname(file.originalname);
      const fileName = `${userId}/${uuidv4()}${fileExtension}`;
      
      // Read file buffer
      const fileBuffer = fs.readFileSync(file.path);

      // Upload to Supabase storage
      const { data, error } = await this.supabase.getServiceRoleClient()
        .storage
        .from('shire-rates-documents')
        .upload(fileName, fileBuffer, {
          contentType: file.mimetype,
          upsert: false,
        });

      if (error) {
        this.logger.error('Error uploading file to Supabase:', error);
        throw new Error('Failed to upload file to storage');
      }

      // Get public URL
      const { data: urlData } = this.supabase.getServiceRoleClient()
        .storage
        .from('shire-rates-documents')
        .getPublicUrl(fileName);

      this.logger.log(`File uploaded successfully: ${fileName}`);
      return urlData.publicUrl;
    } catch (error) {
      this.logger.error('Error in uploadFile:', error);
      throw error;
    }
  }

  async downloadFile(documentUrl: string): Promise<string> {
    try {
      // Extract file path from URL
      const urlParts = documentUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const filePath = urlParts.slice(-2).join('/'); // userId/filename

      // Download from Supabase storage
      const { data, error } = await this.supabase.getServiceRoleClient()
        .storage
        .from('shire-rates-documents')
        .download(filePath);

      if (error) {
        this.logger.error('Error downloading file from Supabase:', error);
        throw new Error('Failed to download file from storage');
      }

      // Save to temporary local file
      const tempDir = './uploads/temp';
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const localPath = path.join(tempDir, `temp-${uuidv4()}-${fileName}`);
      const buffer = Buffer.from(await data.arrayBuffer());
      fs.writeFileSync(localPath, buffer);

      this.logger.log(`File downloaded to: ${localPath}`);
      return localPath;
    } catch (error) {
      this.logger.error('Error in downloadFile:', error);
      throw error;
    }
  }

  async deleteFile(documentUrl: string): Promise<void> {
    try {
      // Extract file path from URL
      const urlParts = documentUrl.split('/');
      const filePath = urlParts.slice(-2).join('/'); // userId/filename

      // Delete from Supabase storage
      const { error } = await this.supabase.getServiceRoleClient()
        .storage
        .from('shire-rates-documents')
        .remove([filePath]);

      if (error) {
        this.logger.error('Error deleting file from Supabase:', error);
        throw new Error('Failed to delete file from storage');
      }

      this.logger.log(`File deleted: ${filePath}`);
    } catch (error) {
      this.logger.error('Error in deleteFile:', error);
      throw error;
    }
  }

  async deleteLocalFile(filePath: string): Promise<void> {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`Local file deleted: ${filePath}`);
      }
    } catch (error) {
      this.logger.error('Error deleting local file:', error);
      // Don't throw error for local file cleanup failures
    }
  }

  async ensureUploadDirectories(): Promise<void> {
    const directories = [
      './uploads/shire-rates',
      './uploads/temp',
    ];

    for (const dir of directories) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.logger.log(`Created directory: ${dir}`);
      }
    }
  }
}
