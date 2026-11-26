import type { Anmeldungen, Workshops } from '@/types/app';
import { APP_IDS } from '@/types/app';
import { extractRecordId } from '@/services/livingAppsService';
import {
  RecordSection, RecordField, RecordRelation, RecordAttachments,
} from '@/components/widgets/RecordView';
import { t, appLabel, fieldLabel } from '@/i18n';
import { usePermissions } from '@/lib/permissions';
import { displayNameOf } from '@/lib/journey/rules';

export interface AnmeldungenDetailsProps {
  /** Der Record — enriched oder roh; alle Felder werden hier gerendert. */
  record: Anmeldungen;
  /** N:1-Ziel „Workshops": volle Liste (Hook-Array) — der Block löst Name + Schlüsselfelder selbst auf. */
  workshopsList: Workshops[];
  /** Klick auf die Workshops-Relation → overlay.push auf dessen Detail. */
  onOpenWorkshops?: (record: Workshops) => void;
}

export function AnmeldungenDetails({
  record,
  workshopsList,
  onOpenWorkshops,
}: AnmeldungenDetailsProps) {
  // attachments are a write to this record — read-only without the platform right
  const perms = usePermissions();
  const workshopTarget = workshopsList.find(r => r.record_id === extractRecordId(record.fields.workshop));
  return (
    <>
      <RecordSection title={t('details')} cols={2}>
        <RecordField label={fieldLabel('anmeldungen', 'vorname')} value={record.fields.vorname} format="text" />
        <RecordField label={fieldLabel('anmeldungen', 'nachname')} value={record.fields.nachname} format="text" />
        <RecordField label={fieldLabel('anmeldungen', 'email')} value={record.fields.email} format="email" />
        <RecordField label={fieldLabel('anmeldungen', 'frage')} value={record.fields.frage} format="longtext" className="md:col-span-2" />
      </RecordSection>

      {/* N:1 — verknüpfte Records: IMMER klickbar, nie eine Text-Sackgasse. */}
      <RecordSection title={t('relations')} cols={1}>
        <RecordRelation
          label={fieldLabel('anmeldungen', 'workshop')}
          name={workshopTarget ? (displayNameOf('workshops', workshopTarget.fields as Record<string, unknown>) || '—') : '—'}
          meta={[workshopTarget?.fields.ort].filter(Boolean).join(' · ') || undefined}
          onClick={workshopTarget && onOpenWorkshops ? () => onOpenWorkshops!(workshopTarget!) : undefined}
        />
      </RecordSection>

      <RecordAttachments appId={APP_IDS.ANMELDUNGEN} recordId={record.record_id} readOnly={!perms.canWrite('anmeldungen')} />
    </>
  );
}
