import { ProfilePhotoField } from '../form-modal/ProfilePhotoField';
import { AthleteAffiliationSection } from './AthleteAffiliationSection';
import { AthleteBirthAddressSection } from './AthleteBirthAddressSection';
import { AthleteDocumentsSection } from './AthleteDocumentsSection';
import { AthleteIdentitySection } from './AthleteIdentitySection';

export function AthletePersonalStep({ athlete, form, lookups, files, validation }) {
  return (
    <div className="space-y-4">
      <ProfilePhotoField
        subjectLabel="Atlet"
        photoFile={files.photoFile}
        preview={files.photoPreview}
        processing={files.photoProcessing}
        onChange={files.handlePhotoChange}
      />
      <AthleteIdentitySection form={form} validation={validation} />
      <AthleteBirthAddressSection form={form} validation={validation} />
      <AthleteDocumentsSection
        athlete={athlete}
        form={form}
        files={files}
        validation={validation}
      />
      <AthleteAffiliationSection athlete={athlete} form={form} lookups={lookups} />
    </div>
  );
}
