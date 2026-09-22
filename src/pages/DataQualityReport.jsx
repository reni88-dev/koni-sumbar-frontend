import { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, LoaderCircle } from 'lucide-react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  QualityActiveFilterChips,
  QualityEmptyState,
  QualityErrorState,
  QualityExportActions,
  QualityFilterPanel,
  QualityLoadingState,
  QualityMetadata,
  QualityPagination,
  QualityReportNavigation,
  QualityScanControl,
  QualitySortControls,
} from '../components/data-quality-report/DataQualityReportShell';
import { DataQualityReportContent } from '../components/data-quality-report/DataQualityReportViews';
import { PrintDataQualityReport } from '../components/data-quality-report/PrintDataQualityReport';
import { getFilenameFromContentDisposition, triggerBlobDownload } from '../features/data-quality-report/exportUtils.js';
import {
  buildQualitySearchParams,
  getDefaultQualityFilters,
  normalizeQualityFilters,
  parseQualitySearchParams,
  validateQualityFilterDraft,
} from '../features/data-quality-report/queryParams.js';
import {
  getAllowedQualityReports,
  QUALITY_SCAN_PERMISSION,
  getFirstAllowedQualityReport,
  getQualityReportByKey,
} from '../features/data-quality-report/reportConfig.js';
import { useAuth } from '../hooks/useAuth';
import { usePermission } from '../hooks/usePermission';
import {
  requestQualityReportExport,
  useInvalidateQualityReportData,
  useLatestQualityScan,
  useQualityReportData,
  useQualityReportFilterOptions,
  useStartQualityScan,
} from '../hooks/queries/useDataQualityReports';

const FILTER_FIELDS = [
  'region_ids', 'organization_ids', 'federation_ids', 'cabor_ids', 'pengcab_ids',
  'date_from', 'date_to', 'as_of_date', 'gender', 'record_status', 'account_status',
  'completeness_category', 'finding_type', 'priority', 'finding_status',
  'document_type', 'document_status', 'search',
];

function hasAppliedFilters(filters) {
  return FILTER_FIELDS.some((field) => Array.isArray(filters[field]) ? filters[field].length > 0 : Boolean(filters[field]));
}

function isReportEmpty(reportKey, response) {
  if (!response) return false;
  if (reportKey === 'summary') {
    return Number(response.data?.profiles_total || 0) === 0;
  }
  return !Array.isArray(response.data) || response.data.length === 0;
}

function exportErrorMessage(error) {
  if (error?.response?.status === 422) {
    return 'Jumlah data melebihi batas ekspor. Persempit filter lalu coba lagi.';
  }
  if (error?.response?.status === 404) {
    return 'Snapshot untuk ekspor tidak tersedia.';
  }
  if (error?.response?.status === 503) {
    return 'Baseline laporan belum tersedia untuk diekspor.';
  }
  return 'Ekspor gagal. Periksa filter dan coba lagi.';
}

function scanStartErrorMessage(error) {
  if (error?.response?.status === 403) {
    return 'Izin menjalankan scan tidak tersedia atau baru saja berubah.';
  }
  if (error?.response?.status === 429) {
    return 'Permintaan scan terlalu sering. Tunggu sebentar lalu coba lagi.';
  }
  return 'Scan gagal dimasukkan ke antrean. Periksa layanan backend lalu coba lagi.';
}
export function DataQualityReportIndex() {
  const { user } = useAuth();
  const firstReport = getFirstAllowedQualityReport(user?.permissions);
  return <Navigate to={firstReport?.path || '/dashboard'} replace />;
}

export function DataQualityReportPage({ reportKey }) {
  const report = getQualityReportByKey(reportKey);
  const { user } = useAuth();
  const { can } = usePermission();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchString = searchParams.toString();
  const appliedFilters = useMemo(
    () => parseQualitySearchParams(reportKey, searchString),
    [reportKey, searchString],
  );
  const [draftFilters, setDraftFilters] = useState(appliedFilters);
  const [filterErrors, setFilterErrors] = useState({});
  const [exportingFormat, setExportingFormat] = useState('');
  const [exportError, setExportError] = useState('');
  const [scanConfirmOpen, setScanConfirmOpen] = useState(false);
  const exportController = useRef(null);
  const observedActiveScanId = useRef(null);
  const invalidatedScanId = useRef(null);
  const allowedReports = useMemo(() => getAllowedQualityReports(user?.permissions), [user?.permissions]);
  const allowedReportKeys = useMemo(() => allowedReports.map((item) => item.key), [allowedReports]);
  const canStartManualScan = reportKey === 'summary' && can(QUALITY_SCAN_PERMISSION);

  useEffect(() => {
    setDraftFilters(appliedFilters);
    setFilterErrors({});
  }, [appliedFilters]);

  useEffect(() => () => exportController.current?.abort(), []);

  const optionsQuery = useQualityReportFilterOptions(appliedFilters, Boolean(report));
  const reportQuery = useQualityReportData(reportKey, appliedFilters, Boolean(report));
  const latestScanQuery = useLatestQualityScan(canStartManualScan);
  const startScanMutation = useStartQualityScan();
  const invalidateQualityReportData = useInvalidateQualityReportData();
  const filterOptions = optionsQuery.data?.data || {};
  const scanRun = latestScanQuery.data?.run || null;

  useEffect(() => {
    if (!canStartManualScan || !scanRun?.id) return;
    if (scanRun.status === 'queued' || scanRun.status === 'running') {
      observedActiveScanId.current = scanRun.id;
      return;
    }
    if (
      scanRun.status === 'succeeded'
      && observedActiveScanId.current === scanRun.id
      && invalidatedScanId.current !== scanRun.id
    ) {
      invalidatedScanId.current = scanRun.id;
      void invalidateQualityReportData();
    }
  }, [canStartManualScan, invalidateQualityReportData, scanRun?.id, scanRun?.status]);

  if (!report) {
    return <Navigate to="/dashboard" replace />;
  }

  const updateUrl = (nextFilters, options = {}) => {
    const params = buildQualitySearchParams(reportKey, nextFilters, options);
    setSearchParams(params);
  };

  const handleApply = (event) => {
    event.preventDefault();
    const validation = validateQualityFilterDraft(reportKey, draftFilters);
    setFilterErrors(validation.errors);
    if (!validation.valid) return;
    const normalized = normalizeQualityFilters(reportKey, { ...draftFilters, page: 1 });
    setDraftFilters(normalized);
    updateUrl(normalized, { resetPage: true });
  };

  const handleReset = () => {
    setFilterErrors({});
    setDraftFilters(getDefaultQualityFilters(reportKey));
    setSearchParams(new URLSearchParams());
  };

  const handleRemoveFilter = (field) => {
    const next = { ...appliedFilters, page: 1 };
    if (field === 'date_range') {
      next.date_from = '';
      next.date_to = '';
    } else {
      next[field] = Array.isArray(next[field]) ? [] : '';
    }
    updateUrl(next, { resetPage: true });
  };

  const handleDirectChange = (field, value) => {
    const next = { ...appliedFilters, [field]: value };
    if (field !== 'page') next.page = 1;
    updateUrl(next, { resetPage: field !== 'page' });
  };

  const handleRequestScan = () => {
    startScanMutation.reset();
    setScanConfirmOpen(true);
  };

  const handleStartScan = () => {
    startScanMutation.mutate(undefined, {
      onSuccess: () => setScanConfirmOpen(false),
      onError: () => setScanConfirmOpen(false),
    });
  };

  const handleExport = async (format) => {
    exportController.current?.abort();
    const controller = new AbortController();
    exportController.current = controller;
    setExportError('');
    setExportingFormat(format);
    try {
      const response = await requestQualityReportExport(reportKey, appliedFilters, format, controller.signal);
      const fallback = `laporan-kualitas-${report.exportReport}.${format}`;
      const filename = getFilenameFromContentDisposition(response.headers?.['content-disposition'], fallback);
      triggerBlobDownload(response.data, filename);
    } catch (error) {
      if (error?.code !== 'ERR_CANCELED') {
        setExportError(exportErrorMessage(error));
      }
    } finally {
      if (exportController.current === controller) {
        exportController.current = null;
        setExportingFormat('');
      }
    }
  };

  const response = reportQuery.data;
  const empty = isReportEmpty(reportKey, response);
  const pagination = reportKey === 'summary' ? null : response?.pagination;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-[1600px] space-y-6">
        <header className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-red-600"><BarChart3 className="h-4 w-4" /> Laporan Kualitas Data</div>
            <h1 className="mt-2 text-2xl font-bold text-slate-900 sm:text-3xl">{report.title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">{report.description}</p>
          </div>
          <div className="flex flex-wrap items-start gap-2">
            <PrintDataQualityReport
              report={report}
              response={response}
              filters={appliedFilters}
              filterOptions={filterOptions}
              disabled={reportQuery.isLoading || reportQuery.isFetching || reportQuery.isError || empty}
              canPrintAll={can('reports.quality.export')}
            />
            <QualityExportActions
              formats={report.formats}
              canExport={can('reports.quality.export')}
              exportingFormat={exportingFormat}
              exportError={exportError}
              onExport={handleExport}
            />
          </div>
        </header>

        <QualityReportNavigation reports={allowedReports} currentKey={reportKey} />

        {canStartManualScan && (
          <QualityScanControl
            run={scanRun}
            isStatusLoading={latestScanQuery.isLoading}
            isStatusFetching={latestScanQuery.isFetching}
            isStatusError={latestScanQuery.isError}
            isStarting={startScanMutation.isPending}
            startError={startScanMutation.isError ? scanStartErrorMessage(startScanMutation.error) : ''}
            onRetryStatus={() => latestScanQuery.refetch()}
            onRequestScan={handleRequestScan}
          />
        )}

        <QualityFilterPanel
          report={report}
          draft={draftFilters}
          setDraft={setDraftFilters}
          options={filterOptions}
          optionsQuery={optionsQuery}
          errors={filterErrors}
          onApply={handleApply}
          onReset={handleReset}
        />

        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <QualityActiveFilterChips
            reportKey={reportKey}
            filters={appliedFilters}
            options={filterOptions}
            onRemove={handleRemoveFilter}
          />
          <div className="flex items-center gap-3 self-end xl:self-auto">
            {reportQuery.isFetching && !reportQuery.isLoading && (
              <span className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500"><LoaderCircle className="h-4 w-4 animate-spin" /> Memperbarui data</span>
            )}
            <QualitySortControls reportKey={reportKey} filters={appliedFilters} onChange={handleDirectChange} />
          </div>
        </div>

        {reportQuery.isLoading ? (
          <QualityLoadingState />
        ) : reportQuery.isError ? (
          <QualityErrorState error={reportQuery.error} onRetry={() => reportQuery.refetch()} canStartScan={canStartManualScan} />
        ) : empty ? (
          <>
            <QualityMetadata metadata={response?.metadata} />
            <QualityEmptyState filtered={hasAppliedFilters(appliedFilters)} />
          </>
        ) : (
          <>
            <QualityMetadata metadata={response?.metadata} />
            <DataQualityReportContent
              reportKey={reportKey}
              response={response}
              filters={appliedFilters}
              allowedReportKeys={allowedReportKeys}
            />
            <QualityPagination
              pagination={pagination}
              onPageChange={(page) => handleDirectChange('page', page)}
              onPerPageChange={(perPage) => {
                const next = { ...appliedFilters, per_page: perPage, page: 1 };
                updateUrl(next, { resetPage: true });
              }}
            />
          </>
        )}
      </div>
      <ConfirmDialog
        isOpen={scanConfirmOpen}
        onClose={() => {
          if (!startScanMutation.isPending) setScanConfirmOpen(false);
        }}
        onConfirm={handleStartScan}
        title="Jalankan Scan Kualitas Data?"
        message="Scan akan membaca data profil dan dokumen untuk membuat baseline laporan terbaru. Proses berjalan di latar belakang dan tidak mengubah data operasional."
        confirmText="Jalankan Scan"
        isPending={startScanMutation.isPending}
      />
    </DashboardLayout>
  );
}
