import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import {
  buildQualityExportRequest,
  buildQualityFiltersRequest,
  buildQualityReportRequest,
  buildQualityScanRequest,
  buildQualityScanStatusRequest,
  isQualityScanActive,
} from '../../features/data-quality-report/queryParams.js';

const QUALITY_SCAN_POLL_INTERVAL = 7_000;

export const qualityReportKeys = {
  all: ['quality-reports'],
  filtersRoot: () => [...qualityReportKeys.all, 'filters'],
  filters: (params) => [...qualityReportKeys.filtersRoot(), params],
  reportsRoot: () => [...qualityReportKeys.all, 'report'],
  reportRoot: (reportKey) => [...qualityReportKeys.reportsRoot(), reportKey],
  report: (reportKey, params) => [...qualityReportKeys.reportRoot(reportKey), params],
  scansRoot: () => [...qualityReportKeys.all, 'scans'],
  latestScan: () => [...qualityReportKeys.scansRoot(), 'latest'],
  scan: (runId) => [...qualityReportKeys.scansRoot(), String(runId)],
};

function shouldRetry(failureCount, error) {
  const status = error?.response?.status;
  if (!status || status >= 500) {
    return status !== 503 && failureCount < 2;
  }
  return false;
}

function sameReportFiltersExceptPagination(previousQuery, currentParams) {
  const previousParams = previousQuery?.queryKey?.[previousQuery.queryKey.length - 1];
  if (!previousParams || typeof previousParams !== 'object') return false;
  const withoutPagination = (params) => Object.fromEntries(
    Object.entries(params).filter(([key]) => key !== 'page' && key !== 'per_page'),
  );
  return JSON.stringify(withoutPagination(previousParams)) === JSON.stringify(withoutPagination(currentParams));
}

export function useQualityReportFilterOptions(filters, enabled = true) {
  const request = buildQualityFiltersRequest(filters);
  return useQuery({
    queryKey: qualityReportKeys.filters(request.params),
    queryFn: async ({ signal }) => {
      const response = await api.get(request.url, { params: request.params, signal });
      return response.data;
    },
    enabled,
    staleTime: 30 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: shouldRetry,
  });
}

export function useQualityReportData(reportKey, filters, enabled = true) {
  const request = buildQualityReportRequest(reportKey, filters);
  return useQuery({
    queryKey: qualityReportKeys.report(reportKey, request.params),
    queryFn: async ({ signal }) => {
      const response = await api.get(request.url, { params: request.params, signal });
      return response.data;
    },
    enabled,
    staleTime: 60 * 1000,
    placeholderData: (previousData, previousQuery) => (
      sameReportFiltersExceptPagination(previousQuery, request.params) ? previousData : undefined
    ),
    retry: shouldRetry,
  });
}

export function useLatestQualityScan(enabled = true) {
  const request = buildQualityScanStatusRequest();
  return useQuery({
    queryKey: qualityReportKeys.latestScan(),
    queryFn: async ({ signal }) => {
      const response = await api.get(request.url, { signal });
      return response.data;
    },
    enabled,
    staleTime: 5_000,
    retry: shouldRetry,
    refetchOnWindowFocus: enabled,
    refetchInterval: (query) => (
      enabled && isQualityScanActive(query.state.data?.run?.status)
        ? QUALITY_SCAN_POLL_INTERVAL
        : false
    ),
  });
}

export function useQualityScanStatus(runId, enabled = true) {
  const normalizedRunId = Number(runId);
  const hasRunId = Number.isInteger(normalizedRunId) && normalizedRunId > 0;
  const request = hasRunId ? buildQualityScanStatusRequest(normalizedRunId) : null;
  return useQuery({
    queryKey: qualityReportKeys.scan(hasRunId ? normalizedRunId : 'disabled'),
    queryFn: async ({ signal }) => {
      const response = await api.get(request.url, { signal });
      return response.data;
    },
    enabled: enabled && hasRunId,
    staleTime: 5_000,
    retry: shouldRetry,
    refetchInterval: (query) => (
      enabled && isQualityScanActive(query.state.data?.status)
        ? QUALITY_SCAN_POLL_INTERVAL
        : false
    ),
  });
}

export function useStartQualityScan() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const request = buildQualityScanRequest();
      const response = await api.request({ method: request.method, url: request.url });
      return response.data;
    },
    onSuccess: (result) => {
      if (!result?.run) return;
      queryClient.setQueryData(qualityReportKeys.latestScan(), { run: result.run });
      queryClient.setQueryData(qualityReportKeys.scan(result.run.id), result.run);
    },
  });
}

export function useInvalidateQualityReportData() {
  const queryClient = useQueryClient();
  return useCallback(() => Promise.all([
    queryClient.invalidateQueries({ queryKey: qualityReportKeys.filtersRoot() }),
    queryClient.invalidateQueries({ queryKey: qualityReportKeys.reportsRoot() }),
  ]), [queryClient]);
}

export async function requestQualityReportExport(reportKey, filters, format, signal) {
  const request = buildQualityExportRequest(reportKey, filters, format);
  return api.get(request.url, {
    params: request.params,
    responseType: 'blob',
    signal,
  });
}
