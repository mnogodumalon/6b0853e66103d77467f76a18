import type { Workshops, Anmeldungen } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { SatelliteSection } from '@/components/SatelliteSection';
import { usePermissions } from '@/lib/permissions';
import { displayNameOf } from '@/lib/journey/rules';

export interface WorkshopsDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Workshops;
  /** 1:N „Anmeldungen" (workshop): VOLLE Liste — der Block filtert auf diesen Record. */
  anmeldungenList: Anmeldungen[];
  /** Zeilen-Klick → overlay.push auf das Anmeldungen-Detail (nie der Edit-Dialog). */
  onOpenAnmeldungen: (record: Anmeldungen) => void;
  /** Kontextuelles „+": öffnet den Anmeldungen-Dialog mit diesem Record vorgesetzt. */
  onAddAnmeldungen?: () => void;
}

export function WorkshopsDetails({
  record,
  anmeldungenList,
  onOpenAnmeldungen,
  onAddAnmeldungen,
}: WorkshopsDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('workshops', 'titel')} value={record.fields.titel} format="text" />
        <RecordField label={fieldLabel('workshops', 'datum')} value={record.fields.datum} format="datetime" />
        <RecordField label={fieldLabel('workshops', 'ort')} value={record.fields.ort} format="text" />
        <RecordField label={fieldLabel('workshops', 'max_teilnehmer')} value={record.fields.max_teilnehmer} format="text" />
      </RecordSection>

      <SatelliteSection
        title={appLabel('anmeldungen')}
        items={anmeldungenList.filter(r => extractRecordId(r.fields.workshop) === record.record_id)}
        map={r => ({ name: displayNameOf('anmeldungen', r.fields as Record<string, unknown>) || appLabel('anmeldungen'), meta: undefined })}
        onOpen={onOpenAnmeldungen}
        onAdd={onAddAnmeldungen}
        getKey={r => r.record_id}
      />

      <RecordAttachments appId={APP_IDS.WORKSHOPS} recordId={record.record_id} readOnly={!perms.canWrite('workshops')} />
    </>
  );
}
