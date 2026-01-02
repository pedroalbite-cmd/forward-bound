import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TabKey } from './useUserPermissions';
import { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface UserWithPermissions {
  id: string;
  email: string;
  full_name: string | null;
  role: AppRole;
  permissions: TabKey[];
}

export function useAdminPermissions() {
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      // Get all profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name');
      
      if (profilesError) throw profilesError;

      // Get all roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');
      
      if (rolesError) throw rolesError;

      // Get all permissions
      const { data: permissions, error: permissionsError } = await supabase
        .from('user_tab_permissions')
        .select('user_id, tab_key');
      
      if (permissionsError) throw permissionsError;

      // Combine data
      const usersWithPermissions: UserWithPermissions[] = profiles.map(profile => {
        const userRole = roles.find(r => r.user_id === profile.id);
        const userPermissions = permissions
          .filter(p => p.user_id === profile.id)
          .map(p => p.tab_key as TabKey);

        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: (userRole?.role as AppRole) || 'user',
          permissions: userPermissions,
        };
      });

      return usersWithPermissions;
    },
  });

  const updatePermissions = useMutation({
    mutationFn: async ({ userId, tabs }: { userId: string; tabs: TabKey[] }) => {
      // Remove admin tab from permissions (admins get it automatically)
      const tabsToSave = tabs.filter(t => t !== 'admin');
      
      // Delete existing permissions
      const { error: deleteError } = await supabase
        .from('user_tab_permissions')
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) throw deleteError;

      // Insert new permissions
      if (tabsToSave.length > 0) {
        const { error: insertError } = await supabase
          .from('user_tab_permissions')
          .insert(tabsToSave.map(tab => ({ user_id: userId, tab_key: tab })));
        
        if (insertError) throw insertError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
  });

  const toggleAdmin = useMutation({
    mutationFn: async ({ userId, makeAdmin }: { userId: string; makeAdmin: boolean }) => {
      if (makeAdmin) {
        // Delete user role if exists, then insert admin
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'user');

        const { error } = await supabase
          .from('user_roles')
          .upsert({ user_id: userId, role: 'admin' as AppRole });
        
        if (error) throw error;
      } else {
        // Delete admin role, ensure user role exists
        await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', 'admin');

        const { error } = await supabase
          .from('user_roles')
          .upsert({ user_id: userId, role: 'user' as AppRole });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['user-role'] });
    },
  });

  return {
    users: users || [],
    loading: isLoading,
    updatePermissions,
    toggleAdmin,
  };
}
