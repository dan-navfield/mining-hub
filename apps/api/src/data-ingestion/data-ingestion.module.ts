import { Module } from '@nestjs/common';
import { DataIngestionController } from './data-ingestion.controller';
import { DataIngestionService } from './data-ingestion.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [DataIngestionController],
  providers: [DataIngestionService],
  exports: [DataIngestionService],
})
export class DataIngestionModule {}
