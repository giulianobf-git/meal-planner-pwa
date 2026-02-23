import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function useProjects() {
    return useQuery({
        queryKey: ['projects'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('projects')
                .select('*')
                .order('is_default', { ascending: false })
                .order('name');
            if (error) throw error;
            return data || [];
        },
    });
}

export function useCreateProject() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ name }) => {
            const { data, error } = await supabase
                .from('projects')
                .insert({ name })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
    });
}

export function useDeleteProject() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async (projectId) => {
            const { error } = await supabase
                .from('projects')
                .delete()
                .eq('id', projectId)
                .eq('is_default', false); // can't delete default
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
    });
}

export function useToggleArchiveProject() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, is_archived }) => {
            const { error } = await supabase
                .from('projects')
                .update({ is_archived })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: ['projects'] }),
    });
}
