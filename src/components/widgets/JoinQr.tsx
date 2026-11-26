/**
 * widgets/JoinQr.tsx — the plan's public pages as BOUND QR codes and links.
 *
 * @since 2026-11-26 (a QR view asked for its page by an entity the page has no link to and
 *        read „noch nicht veröffentlicht“ over a published page)
 *
 * GENERATED FROM THE PLAN — one component and one hook per public page, already tied to
 * its page. Place it; never name an entity or a slug, never call PublicPageQr or
 * usePublicPageLink yourself for a page listed here:
 *   <WorkshopAnmeldenQr recordId={<id of the workshops record>} size="34vh" />   → #/public/workshop-anmelden?…=<that record>
 * Every component takes the QR's own props (size, showLink, linkClassName …).
 */
import { PublicPageQr, usePublicPageLink, type PublicPageQrProps } from '@/components/widgets/PublicPageQr';

type QrProps = Omit<PublicPageQrProps, 'entity' | 'recordId' | 'page'>;
type ForRecord = QrProps & { recordId: string | null | undefined };

/** „workshop-anmelden“ for ONE workshops record — Interessierte scannen den QR-Code und melden sich ohne Login für genau diesen Workshop an: Vorname, Nachname, E-Mail-Adresse und eine optionale Frage an die Ref */
export function WorkshopAnmeldenQr({ recordId, ...qr }: ForRecord) {
  return <PublicPageQr entity="workshops" recordId={recordId} page="workshop-anmelden" {...qr} />;
}
export function useWorkshopAnmeldenLink(recordId: string | null | undefined) {
  return usePublicPageLink('workshops', recordId, 'workshop-anmelden');
}
