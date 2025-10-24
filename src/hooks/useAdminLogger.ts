import { useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export type AdminActionType = 
  | 'view_analytics'
  | 'trigger_digest'
  | 'view_user_data'
  | 'view_cron_logs'
  | 'access_dashboard'
  | 'filter_data'
  | 'export_data'
  | 'change_settings';

interface LogAdminActionParams {
  actionType: AdminActionType;
  details?: Record<string, any>;
}

export const useAdminLogger = () => {
  const { user } = useAuth();

  const logAction = useCallback(async ({ actionType, details = {} }: LogAdminActionParams) => {
    if (!user) return;

    try {
      // Get IP address (in production, this would come from a backend service)
      const ipAddress = 'client-side'; // Placeholder

      const { error } = await supabase
        .from('admin_activity_logs')
        .insert({
          admin_id: user.id,
          action_type: actionType,
          details,
          ip_address: ipAddress,
        });

      if (error) {
        console.error('Failed to log admin action:', error);
      }
    } catch (err) {
      console.error('Error logging admin action:', err);
    }
  }, [user]);

  return { logAction };
};
