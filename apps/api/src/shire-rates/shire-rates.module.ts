import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ShireRatesController } from './shire-rates.controller';
import { ShireRatesService } from './shire-rates.service';
import { OCRService } from './ocr.service';
import { FileUploadService } from './file-upload.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [
    SupabaseModule,
    MulterModule.register({
      dest: './uploads/shire-rates',
    }),
  ],
  controllers: [ShireRatesController],
  providers: [ShireRatesService, OCRService, FileUploadService],
  exports: [ShireRatesService],
})
export class ShireRatesModule {}
