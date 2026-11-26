// Composition: no urgent signal that a write could resolve → the workshop cards ARE the hero.
// CalendarWidget rejected: it lacks a per-item capacity meter + the QR action and the owner
// reads occupancy, not a time grid. Layout: variant="split", StatStrip KPIs, aside = Anmeldungen
// with a question (other entity). Mobile: the work list comes first, then the cards (grid order).
import { useMemo, useState } from 'react';
import { format } from 'date-fns';
import { IconCalendarEvent, IconMapPin, IconPlus, IconQrcode, IconUsers, IconMessageQuestion } from '@tabler/icons-react';
import type { DashboardData } from '@/hooks/useDashboardData';
import { useEntityCrud } from '@/components/EntityCrud';
import { DashboardGrid } from '@/components/DashboardGrid';
import { StatStrip, StatStripItem } from '@/components/StatCard';
import { WorkList } from '@/components/WorkList';
import { Button } from '@/components/ui/button';
import { extractRecordId } from '@/services/livingAppsService';
import { formatDate } from '@/lib/formatters';
import { useClock, gruss } from '@/lib/polish';
import { tx, appLabel } from '@/i18n';
import { countOf, viewHref } from '@/config/plan';

export default function DashboardOverview({ data }: { data: DashboardData }) {
  const { workshops, anmeldungen } = data;
  const crud = useEntityCrud(data);
  const enrichedAnmeldungen = crud.enriched.anmeldungen;
  const clock = useClock();
  const [fullOnly, setFullOnly] = useState(false);
  const [showPast, setShowPast] = useState(false);

  const nowKey = format(clock, "yyyy-MM-dd'T'HH:mm");

  const rows = useMemo(() => {
    const counts = new Map<string, number>();
    for (const a of anmeldungen) {
      const id = extractRecordId(a.fields.workshop);
      if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return workshops.map(w => {
      const count = counts.get(w.record_id) ?? 0;
      const max = w.fields.max_teilnehmer ?? 0;
      const free = max - count;
      const past = (w.fields.datum ?? '') < nowKey;
      return { w, count, max, free, full: free <= 0, past };
    });
  }, [workshops, anmeldungen, nowKey]);

  const sorted = useMemo(() => {
    const up = rows.filter(r => !r.past).sort((a, b) => (a.w.fields.datum ?? '').localeCompare(b.w.fields.datum ?? ''));
    const old = rows.filter(r => r.past).sort((a, b) => (b.w.fields.datum ?? '').localeCompare(a.w.fields.datum ?? ''));
    return [...up, ...old];
  }, [rows]);

  const upcoming = sorted.filter(r => !r.past);
  const fullUpcoming = upcoming.filter(r => r.full);
  const freeUpcoming = upcoming.reduce((s, r) => s + Math.max(0, r.free), 0);
  const visible = sorted.filter(r => (showPast || !r.past) && (!fullOnly || r.full));
  const pastCount = sorted.length - upcoming.length;

  const withQuestion = enrichedAnmeldungen
    .filter(a => (a.fields.frage ?? '').trim() !== '')
    .sort((a, b) => String(b.createdat ?? '').localeCompare(String(a.createdat ?? '')));

  const next = upcoming[0];
  const context = next
    ? tx`Als Nächstes: ${next.w.fields.titel ?? ''} am ${formatDate(next.w.fields.datum)} — ${next.count} von ${next.max} Plätzen belegt.`
    : tx('Noch kein Workshop geplant — leg den ersten an und zeig den QR-Code vor Ort.');

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold">{gruss(clock)}</h1>
          <p className="mt-1 text-muted-foreground">{context}</p>
        </div>
        {crud.workshops.canWrite && (
          <Button onClick={() => crud.workshops.openCreate({})}>
            <IconPlus size={16} className="shrink-0" />
            <span>{tx('Workshop anlegen')}</span>
          </Button>
        )}
      </div>

      <DashboardGrid
        variant="split"
        kpis={workshops.length > 0 ? (
          <StatStrip>
            <StatStripItem
              title={tx('Kommende Workshops')}
              value={upcoming.length}
              icon={<IconCalendarEvent size={18} className="text-muted-foreground" />}
            />
            <StatStripItem
              title={tx('Freie Plätze')}
              value={freeUpcoming}
              icon={<IconUsers size={18} className="text-muted-foreground" />}
            />
            <StatStripItem
              title={tx('Ausgebucht')}
              value={fullUpcoming.length}
              tone={fullUpcoming.length > 0 ? 'warning' : 'default'}
              onClick={() => setFullOnly(f => !f)}
              active={fullOnly}
            />
          </StatStrip>
        ) : undefined}
        aside={
          <WorkList
            title={tx('Fragen an die Referentin')}
            items={withQuestion.map(a => ({
              id: a.record_id,
              title: `${a.fields.vorname ?? ''} ${a.fields.nachname ?? ''}`.trim(),
              secondLine: (
                <>
                  <span className="text-muted-foreground">{a.workshopName} · </span>
                  <span className="font-medium">{a.fields.frage}</span>
                </>
              ),
            }))}
            onItemClick={id => {
              const rec = anmeldungen.find(a => a.record_id === id);
              if (rec) crud.anmeldungen.openDetail(rec);
            }}
            empty={{ text: tx('Noch keine Fragen eingegangen.') }}
            max={5}
          />
        }
        primary={
          workshops.length === 0 ? (
            <div className="flex flex-col items-center gap-3 overflow-hidden rounded-xl border bg-card p-10 text-center">
              <IconQrcode size={48} className="text-muted-foreground" />
              <p className="text-muted-foreground">{tx('Lege deinen ersten Workshop an — danach bekommt er einen eigenen QR-Code für die Anmeldung.')}</p>
              {crud.workshops.canWrite && (
                <Button onClick={() => crud.workshops.openCreate({})}>{tx('Ersten Workshop anlegen')}</Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-semibold">{appLabel('workshops')}</h2>
                {pastCount > 0 && (
                  <Button variant="outline" size="sm" onClick={() => setShowPast(s => !s)}>
                    {showPast ? tx('Vergangene ausblenden') : tx('Vergangene anzeigen')}
                  </Button>
                )}
              </div>
              {visible.length === 0 && (
                <p className="rounded-xl border bg-card p-6 text-center text-muted-foreground">{tx('Keine Workshops in dieser Auswahl.')}</p>
              )}
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                {visible.map(r => {
                  const pct = r.max > 0 ? Math.min(100, Math.round((r.count / r.max) * 100)) : 100;
                  return (
                    <div
                      key={r.w.record_id}
                      className={`flex flex-col gap-3 overflow-hidden rounded-xl border bg-card p-4 ${r.past ? 'opacity-70' : ''}`}
                    >
                      <button type="button" className="min-w-0 text-left" onClick={() => crud.workshops.openDetail(r.w)}>
                        <div className="flex items-start justify-between gap-2">
                          <span className="line-clamp-2 font-semibold">{r.w.fields.titel}</span>
                          {r.full && !r.past && (
                            <span className="shrink-0 rounded-md bg-destructive px-2 py-0.5 text-xs font-semibold text-destructive-foreground">{tx('Ausgebucht')}</span>
                          )}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                          <IconCalendarEvent size={14} className="shrink-0" />
                          <span className="truncate">{formatDate(r.w.fields.datum)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <IconMapPin size={14} className="shrink-0" />
                          <span className="truncate">{r.w.fields.ort}</span>
                        </div>
                      </button>
                      <div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full ${r.full ? 'bg-destructive' : 'bg-primary'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 text-sm">
                          <span>{countOf('anmeldungen', r.count, appLabel('anmeldungen'))}</span>
                          <span className={r.full ? 'font-semibold text-destructive' : 'font-medium'}>
                            {r.free < 0 ? tx`${-r.free} überbucht` : r.free === 0 ? tx('Keine freien Plätze') : tx`${r.free} von ${r.max} Plätzen frei`}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button asChild size="sm">
                          <a href={viewHref('workshop-qr-code', r.w.record_id)} target="_blank" rel="noopener noreferrer">
                            <IconQrcode size={16} className="shrink-0" />
                            <span>{tx('QR-Code zeigen')}</span>
                          </a>
                        </Button>
                        {crud.workshops.canWrite && (
                          <Button size="sm" variant="outline" onClick={() => crud.workshops.openEdit(r.w)}>
                            {tx('Bearbeiten')}
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              {withQuestion.length === 0 && anmeldungen.length === 0 && (
                <p className="flex items-center gap-2 text-sm text-muted-foreground">
                  <IconMessageQuestion size={16} className="shrink-0" />
                  {tx('Sobald sich jemand per QR-Code anmeldet, siehst du es hier.')}
                </p>
              )}
            </div>
          )
        }
      />
      {crud.surfaces}
    </div>
  );
}
