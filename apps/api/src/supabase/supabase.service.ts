import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private supabase: SupabaseClient;
  private serviceRoleClient: SupabaseClient;

  constructor(private configService: ConfigService) {}

  onModuleInit() {
    const supabaseUrl = this.configService.get('SUPABASE_URL');
    const supabaseAnonKey = this.configService.get('SUPABASE_ANON_KEY');
    const supabaseServiceRoleKey = this.configService.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase URL and Anon Key are required');
    }

    // Client for user operations (with RLS)
    this.supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Service role client for admin operations (bypasses RLS)
    if (supabaseServiceRoleKey) {
      this.serviceRoleClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }

  getClient(): SupabaseClient {
    return this.supabase;
  }

  getServiceRoleClient(): SupabaseClient {
    if (!this.serviceRoleClient) {
      throw new Error('Service role client not configured');
    }
    return this.serviceRoleClient;
  }

  // Helper method to set user context for RLS
  setUser(accessToken: string) {
    return this.supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: '', // We'll handle refresh separately
    });
  }
}
