import { CoachAchievementsSection } from './CoachAchievementsSection';
import { CoachCertificateSection } from './CoachCertificateSection';
import { CoachLicenseSection } from './CoachLicenseSection';

export function CoachLicenseCareerStep({ coach, form, files, validation, loading }) {
  return (
    <div className="space-y-4">
      <CoachLicenseSection form={form} />
      <CoachCertificateSection
        coach={coach}
        files={files}
        validation={validation}
        loading={loading}
      />
      <CoachAchievementsSection form={form} />
    </div>
  );
}
