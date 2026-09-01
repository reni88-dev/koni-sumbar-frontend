import { Activity, AlertTriangle, Heart, Trophy, User } from 'lucide-react';
import { AthleteCareerStep } from './athlete-form/AthleteCareerStep';
import { AthleteParentsStep } from './athlete-form/AthleteParentsStep';
import { AthletePersonalStep } from './athlete-form/AthletePersonalStep';
import { AthletePhysicalContactStep } from './athlete-form/AthletePhysicalContactStep';
import { useAthleteFormController } from './athlete-form/useAthleteFormController';
import { ValidationSummary } from './form-validation/ValidationSummary';
import { WizardModalShell } from './form-modal/WizardModalShell';

const STEPS = [
  { id: 1, title: 'Data Pribadi', subtitle: 'Biodata & Dokumen', icon: User },
  { id: 2, title: 'Fisik & Kontak', subtitle: 'Ukuran, Medis & Akun', icon: Activity },
  { id: 3, title: 'Karir & Prestasi', subtitle: 'Cabor & Riwayat Juara', icon: Trophy },
  { id: 4, title: 'Data Orang Tua', subtitle: 'Wali & Kontak Darurat', icon: Heart },
];

export function AthleteFormModal({ isOpen, onClose, athlete, onSuccess }) {
  const controller = useAthleteFormController({ isOpen, athlete, onSuccess });
  if (!isOpen) return null;

  const {
    formContainerRef,
    validationSummaryRef,
    form,
    lookups,
    files,
    validation,
    navigation,
    submission,
  } = controller;
  const legacyNotice = athlete && validation.initialIncompleteCount > 0 ? (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      <div>
        <p className="text-sm font-bold">Data lama perlu dilengkapi</p>
        <p className="mt-0.5 text-xs text-amber-800">
          Profil awal belum memenuhi {validation.initialIncompleteCount} aturan terbaru. Simpan setelah seluruh field wajib diperbaiki.
        </p>
      </div>
    </div>
  ) : null;

  return (
    <WizardModalShell
      modalKey="athlete-form"
      eyebrow={'KONI SUMATERA BARAT � FORM DATA ATLET'}
      title={athlete ? `Edit Data: ${athlete.name}` : 'Registrasi Atlet Baru'}
      description="Lengkapi data profil atlet secara teliti pada 4 tahapan formulir berikut."
      steps={STEPS}
      step={navigation.step}
      onStepChange={navigation.setStep}
      onClose={onClose}
      errors={validation.errors}
      errorMessage={validation.errorMessage}
      validationSummary={(
        <ValidationSummary
          ref={validationSummaryRef}
          errors={validation.errors}
          metadata={validation.metadata}
          onNavigate={validation.navigateToError}
        />
      )}
      stepErrorCounts={validation.stepErrorCounts}
      notice={legacyNotice}
      formContainerRef={formContainerRef}
      onPrevious={navigation.goToPrevStep}
      onNext={navigation.goToNextStep}
      onSubmit={submission.handleSubmit}
      loading={submission.loading}
      fileProcessing={files.isAnyFileProcessing}
      submitLabel={athlete ? 'Simpan Perubahan' : 'Simpan Data Atlet'}
    >
      {navigation.step === 1 && (
        <AthletePersonalStep
          athlete={athlete}
          form={form}
          lookups={lookups}
          files={files}
          validation={validation}
        />
      )}
      {navigation.step === 2 && (
        <AthletePhysicalContactStep form={form} lookups={lookups} validation={validation} />
      )}
      {navigation.step === 3 && <AthleteCareerStep form={form} validation={validation} />}
      {navigation.step === 4 && <AthleteParentsStep form={form} validation={validation} />}
    </WizardModalShell>
  );
}
