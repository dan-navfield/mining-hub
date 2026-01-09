import { Module } from '@nestjs/common';
import { HoldersController } from './holders.controller';
import { HoldersService } from './holders.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [HoldersController],
  providers: [HoldersService],
  exports: [HoldersService],
})
export class HoldersModule {}
