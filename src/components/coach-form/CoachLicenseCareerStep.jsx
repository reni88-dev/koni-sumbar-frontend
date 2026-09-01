import { CoachAchievementsSection } from './CoachAchievementsSection';
import { CoachCertificateSection } from './CoachCertificateSection';
import { CoachLicenseSection } from './CoachLicenseSection';

export function CoachLicenseCareerStep({ coach, form, files, validation, loading, showActiveStatus = true }) {
  return (
    <div className="space-y-4">
      <CoachLicenseSection form={form} />
      <CoachCertificateSection
        coach={coach}
        files={files}
        validation={validation}
        loading={loading}
      />
      <CoachAchievementsSection form={form} validation={validation} showActiveStatus={showActiveStatus} />
    </div>
  );
}
