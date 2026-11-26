/**
 * src/pages/views/WorkshopQrCodeView.tsx — the view „QR-Code“ the plan orders (dashboard.views).
 *
 * ROUTE   #/ansicht/workshop-qr-code — outside the dashboard chrome (beamer / kiosk surface).
 * LIVE    static — loads once.
 * READS   workshops (titel, datum) for ONE record, opened as `?record=<id>`.
 * JOIN    <WorkshopAnmeldenQr recordId={id} size="34vh" /> — bound to the public page „workshop-anmelden“.
 * PURPOSE Den QR-Code eines Workshops bildschirmfüllend zeigen, darüber Titel und Datum.
 */
import { useLiveRecords } from '@/hooks/useLiveRecords';
import { tx } from '@/i18n';
import { formatDate } from '@/lib/formatters';
import { WorkshopAnmeldenQr } from '@/components/widgets/JoinQr';

export default function WorkshopQrCodeView() {
  const pinned = (new URLSearchParams(window.location.hash.split('?')[1] ?? '').get('record') ?? '').replace(/["\\]/g, '');
  const workshops = useLiveRecords('workshops', { intervalMs: 0 });
  const workshop = pinned ? workshops.records.find(r => r.record_id === pinned) : undefined;
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-background p-6 text-center text-foreground">
      {!pinned && (
        <p data-view-no-record style={{ fontSize: 'clamp(1.5rem, 2.8vh, 3rem)' }}>{tx('Bitte in der Übersicht einen Workshop wählen')}</p>
      )}
      {pinned && workshop && (
        <>
          <h1 className="max-w-full font-semibold" style={{ fontSize: 'clamp(2rem, 6vh, 5rem)' }}>{workshop.fields.titel}</h1>
          <p className="text-muted-foreground" style={{ fontSize: 'clamp(1.5rem, 3.5vh, 3rem)' }}>{formatDate(workshop.fields.datum)}</p>
          <WorkshopAnmeldenQr recordId={workshop.record_id} size="60vh" />
        </>
      )}
      {pinned && !workshop && !workshops.error && (
        <p className="text-muted-foreground" style={{ fontSize: 'clamp(1.5rem, 2.8vh, 3rem)' }}>{tx('Wird geladen …')}</p>
      )}
      {workshops.error && workshops.records.length === 0 && (
        <p role="alert" data-live-error className="text-destructive" style={{ fontSize: 'clamp(1.5rem, 2.8vh, 3rem)' }}>
          {workshops.unauthorized ? tx('Bitte melde dich an, um diese Ansicht zu sehen.') : tx('Die Daten konnten nicht geladen werden.')}
        </p>
      )}
    </main>
  );
}
