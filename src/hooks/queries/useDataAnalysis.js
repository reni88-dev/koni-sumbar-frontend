import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { athleteKeys } from './useAthletes';
import { coachKeys } from './useCoaches';

export const dataAnalysisKeys = {
  all: ['data-analysis'],
  duplicates: () => [...dataAnalysisKeys.all, 'duplicates'],
  duplicateList: (filters) => [...dataAnalysisKeys.duplicates(), filters],
};

export const dataSummaryKeys = {
  all: ['data-summary'],
  detail: (filters) => [...dataSummaryKeys.all, filters],
};

export function useDataDuplicates(filters) {
  return useQuery({
    queryKey: dataAnalysisKeys.duplicateList(filters),
    queryFn: async () => {
      const response = await api.get('/api/data-analysis/duplicates', {
        params: {
          entity: filters.entity,
          confidence: filters.confidence === 'all' ? undefined : filters.confidence,
          review_status: filters.reviewStatus === 'all' ? undefined : filters.reviewStatus,
          search: filters.search || undefined,
          page: filters.page,
          per_page: filters.perPage,
        },
      });
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });
}

export function useRefreshDataDuplicates() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await api.post('/api/data-analysis/duplicates/refresh');
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dataAnalysisKeys.all });
      queryClient.invalidateQueries({ queryKey: dataSummaryKeys.all });
    },
  });
}

export function useReviewDataDuplicate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const response = await api.put('/api/data-analysis/duplicates/review', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: dataAnalysisKeys.duplicates() });
      queryClient.invalidateQueries({ queryKey: dataSummaryKeys.all });
    },
  });
}

export function useDeleteDataDuplicateRecord() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (record) => {
      const resource = record?.entity_type === 'athlete'
        ? 'athletes'
        : record?.entity_type === 'coach'
          ? 'coaches'
          : '';
      if (!resource || !record?.id) {
        throw new Error('Record duplikat tidak valid.');
      }
      await api.delete(`/api/${resource}/${record.id}`);
      return record;
    },
    onSuccess: (record) => {
      const entityKey = record.entity_type === 'athlete' ? athleteKeys.all : coachKeys.all;
      queryClient.invalidateQueries({ queryKey: entityKey });
      queryClient.invalidateQueries({ queryKey: dataSummaryKeys.all });
    },
  });
}

export function useDataSummary(filters) {
  return useQuery({
    queryKey: dataSummaryKeys.detail(filters),
    queryFn: async () => {
      const response = await api.get('/api/data-summary', {
        params: {
          organization_id: filters.organizationId || undefined,
          cabor_id: filters.caborId || undefined,
          status: filters.status === 'all' ? undefined : filters.status,
          trend_granularity: filters.trendGranularity,
          trend_start_date: filters.trendStartDate,
          trend_end_date: filters.trendEndDate,
          period_months: filters.periodMonths,
        },
      });
      return response.data;
    },
    placeholderData: (previousData) => previousData,
  });
}
