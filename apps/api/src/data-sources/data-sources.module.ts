import { Module } from '@nestjs/common';
import { DataSourcesController } from './data-sources.controller';
import { DataSourcesService } from './data-sources.service';
import { WADataSourceService } from './providers/wa.service';
import { NSWDataSourceService } from './providers/nsw.service';
import { VICDataSourceService } from './providers/vic.service';
import { NTDataSourceService } from './providers/nt.service';
import { QLDDataSourceService } from './providers/qld.service';
import { TASDataSourceService } from './providers/tas.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [DataSourcesController],
  providers: [
    DataSourcesService,
    WADataSourceService,
    NSWDataSourceService,
    VICDataSourceService,
    NTDataSourceService,
    QLDDataSourceService,
    TASDataSourceService,
  ],
  exports: [DataSourcesService],
})
export class DataSourcesModule {}
