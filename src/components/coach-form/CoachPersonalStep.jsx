import { ProfilePhotoField } from '../form-modal/ProfilePhotoField';
import { CoachAffiliationSection } from './CoachAffiliationSection';
import { CoachIdentitySection } from './CoachIdentitySection';

export function CoachPersonalStep({ form, lookups, files, validation }) {
  return (
    <div className="space-y-4">
      <ProfilePhotoField
        subjectLabel="Pelatih"
        photoFile={files.photoFile}
        preview={files.photoPreview}
        processing={files.photoProcessing}
        onChange={files.handlePhotoChange}
      />
      <CoachIdentitySection form={form} validation={validation} />
      <CoachAffiliationSection form={form} lookups={lookups} validation={validation} />
    </div>
  );
}
