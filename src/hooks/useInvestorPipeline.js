import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/api/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import posthog from 'posthog-js';

const TAG_SORT_ORDER = { hot: 0, warm: 1, potential_fit: 2, not_a_fit: 3 };

function sortByTag(items) {
  return [...items].sort((a, b) => {
    const aOrder = a.tag ? (TAG_SORT_ORDER[a.tag] ?? 4) : 5;
    const bOrder = b.tag ? (TAG_SORT_ORDER[b.tag] ?? 4) : 5;
    return aOrder - bOrder;
  });
}

export const useInvestorPipeline = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: pipelineItems = [], isLoading } = useQuery({
    queryKey: ['investor-pipeline', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Fetch pipeline rows
      const { data: rows, error } = await supabase
        .from('investor_pipeline')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) return [];
      if (!rows?.length) return [];

      // Batch-fetch investor details
      const investorIds = rows.map((r) => r.investor_id);
      const { data: investors } = await supabase
        .from('public_investors')
        .select('*')
        .in('id', investorIds);

      const investorMap = new Map((investors || []).map((i) => [String(i.id), i]));

      // Merge pipeline data with investor data
      return rows.map((row) => ({
        ...row,
        investor: investorMap.get(String(row.investor_id)) || null,
      }));
    },
    enabled: !!user,
    retry: false,
  });

  const addToPipeline = useMutation({
    mutationFn: async ({ investorId, stage = 'research', tag = null }) => {
      if (!user) throw new Error('Must be logged in');
      const { data, error } = await supabase
        .from('investor_pipeline')
        .upsert(
          {
            user_id: user.id,
            investor_id: String(investorId),
            stage,
            tag,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,investor_id' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onMutate: async ({ investorId, stage = 'research', tag = null }) => {
      await queryClient.cancelQueries({ queryKey: ['investor-pipeline', user?.id] });
      const previous = queryClient.getQueryData(['investor-pipeline', user?.id]);
      queryClient.setQueryData(['investor-pipeline', user?.id], (old = []) => [
        ...old,
        { investor_id: String(investorId), stage, tag, user_id: user?.id, created_at: new Date().toISOString() },
      ]);
      return { previous };
    },
    onSuccess: (data) => {
      posthog.capture('investor_added_to_pipeline', { stage: data.stage });
      toast.success('Added to pipeline', { description: `Stage: ${data.stage.replace('_', ' ')}` });
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['investor-pipeline', user?.id], context.previous);
      toast.error('Failed to add to pipeline');
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['investor-pipeline', user?.id] }),
  });

  // Helper: optimistic update for a single field on a pipeline item
  const optimisticFieldUpdate = (field) => ({
    onMutate: async (vars) => {
      const investorId = typeof vars === 'string' ? vars : vars.investorId;
      const value = typeof vars === 'string' ? undefined : vars[field];
      await queryClient.cancelQueries({ queryKey: ['investor-pipeline', user?.id] });
      const previous = queryClient.getQueryData(['investor-pipeline', user?.id]);
      queryClient.setQueryData(['investor-pipeline', user?.id], (old = []) =>
        field
          ? old.map(p => String(p.investor_id) === String(investorId) ? { ...p, [field]: value } : p)
          : old.filter(p => String(p.investor_id) !== String(investorId))
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['investor-pipeline', user?.id], context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['investor-pipeline', user?.id] }),
  });

  const updateStage = useMutation({
    mutationFn: async ({ investorId, stage }) => {
      if (!user) throw new Error('Must be logged in');
      const { data, error } = await supabase
        .from('investor_pipeline')
        .update({ stage, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('investor_id', String(investorId))
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    ...optimisticFieldUpdate('stage'),
    onSuccess: (data) => {
      posthog.capture('investor_stage_changed', { stage: data.stage });
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['investor-pipeline', user?.id], context.previous);
      toast.error('Failed to update stage');
    },
  });

  const updateTag = useMutation({
    mutationFn: async ({ investorId, tag }) => {
      if (!user) throw new Error('Must be logged in');
      const { data, error } = await supabase
        .from('investor_pipeline')
        .update({ tag, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('investor_id', String(investorId))
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    ...optimisticFieldUpdate('tag'),
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['investor-pipeline', user?.id], context.previous);
      toast.error('Failed to update tag');
    },
  });

  const updateNotes = useMutation({
    mutationFn: async ({ investorId, notes }) => {
      if (!user) throw new Error('Must be logged in');
      const { data, error } = await supabase
        .from('investor_pipeline')
        .update({ notes, updated_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('investor_id', String(investorId))
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    ...optimisticFieldUpdate('notes'),
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['investor-pipeline', user?.id], context.previous);
      toast.error('Failed to save notes');
    },
  });

  const removeFromPipeline = useMutation({
    mutationFn: async (investorId) => {
      if (!user) throw new Error('Must be logged in');
      const { error } = await supabase
        .from('investor_pipeline')
        .delete()
        .eq('user_id', user.id)
        .eq('investor_id', String(investorId));
      if (error) throw error;
    },
    ...optimisticFieldUpdate(null), // null = remove mode
    onSuccess: () => toast.success('Removed from pipeline'),
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(['investor-pipeline', user?.id], context.previous);
      toast.error('Failed to remove from pipeline');
    },
  });

  const isInPipeline = (investorId) =>
    pipelineItems.some((p) => String(p.investor_id) === String(investorId));

  const getItem = (investorId) =>
    pipelineItems.find((p) => String(p.investor_id) === String(investorId));

  const getByStage = (stage) =>
    sortByTag(pipelineItems.filter((p) => p.stage === stage));

  return {
    pipelineItems,
    isLoading,
    addToPipeline: addToPipeline.mutate,
    updateStage: updateStage.mutate,
    updateTag: updateTag.mutate,
    updateNotes: updateNotes.mutate,
    removeFromPipeline: removeFromPipeline.mutate,
    isInPipeline,
    getItem,
    getByStage,
  };
};
