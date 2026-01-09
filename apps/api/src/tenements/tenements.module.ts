import { Module } from '@nestjs/common';
import { TenementsController } from './tenements.controller';
import { TenementsService } from './tenements.service';
import { SupabaseModule } from '../supabase/supabase.module';

@Module({
  imports: [SupabaseModule],
  controllers: [TenementsController],
  providers: [TenementsService],
  exports: [TenementsService],
})
export class TenementsModule {}
