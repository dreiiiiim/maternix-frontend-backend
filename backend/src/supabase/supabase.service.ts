import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

type CallerProfile = {
  role: 'student' | 'instructor' | 'admin';
  status: 'pending' | 'approved' | 'rejected';
}

@Injectable()
export class SupabaseService {
  private readonly serviceClient: SupabaseClient

  constructor(private readonly config: ConfigService) {
    this.serviceClient = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY')!
    )
  }

  getServiceClient() {
    return this.serviceClient
  }

  async verifyAndGetProfile(
    accessToken: string
  ): Promise<{ user: User; profile: CallerProfile } | null> {
    if (!accessToken) return null

    const anonClient = createClient(
      this.config.get<string>('SUPABASE_URL')!,
      this.config.get<string>('SUPABASE_ANON_KEY')!
    )

    const {
      data: { user },
      error,
    } = await anonClient.auth.getUser(accessToken)

    if (error || !user) return null

    const { data: profile } = await this.serviceClient
      .from('profiles')
      .select('role, status')
      .eq('id', user.id)
      .single()

    if (!profile) return null
    return { user, profile: profile as CallerProfile }
  }
}
