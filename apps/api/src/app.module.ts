import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { SupabaseModule } from './supabase/supabase.module';
import { DataSourcesModule } from './data-sources/data-sources.module';
import { TenementsModule } from './tenements/tenements.module';
import { ActionsModule } from './actions/actions.module';
import { ShireRatesModule } from './shire-rates/shire-rates.module';
import { HoldersModule } from './holders/holders.module';
import { CompanyLookupModule } from './company-lookup/company-lookup.module';
import { DataIngestionModule } from './data-ingestion/data-ingestion.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD,
      },
    }),
    SupabaseModule,
    DataSourcesModule,
    TenementsModule,
    ActionsModule,
    ShireRatesModule,
    HoldersModule,
    CompanyLookupModule,
    DataIngestionModule,
  ],
})
export class AppModule {}
