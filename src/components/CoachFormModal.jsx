import { Award, Phone, User } from 'lucide-react';
import { CoachContactStep } from './coach-form/CoachContactStep';
import { CoachLicenseCareerStep } from './coach-form/CoachLicenseCareerStep';
import { CoachPersonalStep } from './coach-form/CoachPersonalStep';
import { useCoachFormController } from './coach-form/useCoachFormController';
import { WizardModalShell } from './form-modal/WizardModalShell';

const STEPS = [
  { id: 1, title: 'Data Pribadi', subtitle: 'Biodata & Afiliasi', icon: User },
  { id: 2, title: 'Kontak & Akun', subtitle: 'No. WhatsApp & Email', icon: Phone },
  { id: 3, title: 'Lisensi & Karir', subtitle: 'Sertifikat & Prestasi', icon: Award }
];

export function CoachFormModal({ isOpen, onClose, coach, onSuccess }) {
  const controller = useCoachFormController({ isOpen, coach, onSuccess });
  if (!isOpen) return null;

  const {
    formContainerRef,
    form,
    lookups,
    files,
    validation,
    navigation,
    submission
  } = controller;

  return (
    <WizardModalShell
      modalKey="coach-form"
      eyebrow={'KONI SUMATERA BARAT \u2022 FORM DATA PELATIH'}
      title={coach ? `Edit Data: ${coach.name}` : 'Registrasi Pelatih Baru'}
      description="Lengkapi data profil pelatih secara teliti pada 3 tahapan formulir berikut."
      steps={STEPS}
      step={navigation.step}
      onStepChange={navigation.setStep}
      onClose={onClose}
      errors={validation.errors}
      errorMessage={validation.errorMessage}
      formContainerRef={formContainerRef}
      onPrevious={navigation.goToPrevStep}
      onNext={navigation.goToNextStep}
      onSubmit={submission.handleSubmit}
      currentStepValid={navigation.currentStepValid}
      loading={submission.loading}
      fileProcessing={files.isAnyFileProcessing}
      submitLabel={coach ? 'Simpan Perubahan' : 'Simpan Data Pelatih'}
    >
      {navigation.step === 1 && (
        <CoachPersonalStep
          form={form}
          lookups={lookups}
          files={files}
          validation={validation}
        />
      )}
      {navigation.step === 2 && <CoachContactStep form={form} validation={validation} />}
      {navigation.step === 3 && (
        <CoachLicenseCareerStep
          coach={coach}
          form={form}
          files={files}
          validation={validation}
          loading={submission.loading}
        />
      )}
    </WizardModalShell>
  );
}

export default CoachFormModal;
