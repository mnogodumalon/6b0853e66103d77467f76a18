import { useEffect, useMemo, useState } from 'react';
import { IconCalendar, IconCircleCheck, IconMapPin } from '@tabler/icons-react';
import { PublicShell } from '@/components/PublicShell';
import { Button } from '@/components/ui/button';
import { Bound } from '@/components/blocks/Bound';
import { FieldErrorSummary } from '@/components/blocks/FieldErrorSummary';
import { LoadProblem } from '@/components/blocks/LoadProblem';
import { tx } from '@/i18n';
import {
  loadPublicPagesConfig, getPublicRecord, prepareChallenge, PageUnavailableError,
  type PublicPagesConfig, type PublicPageConfig,
} from '@/lib/publicClient';
import { createPublicPort } from '@/lib/journey/publicPort';
import {
  useStepForm, useJourneySubmit, fieldText, type JourneyRecord,
} from '@/lib/journey';

const SLUG = 'workshop-anmelden';

function linkedId(): string | null {
  const q = window.location.hash.split('?')[1] ?? '';
  const v = new URLSearchParams(q).get('workshop');
  return v && /^[a-f0-9]{24}$/i.test(v) ? v : null;
}

export default function WorkshopAnmelden() {
  const [cfg, setCfg] = useState<PublicPagesConfig | null>(null);
  const [page, setPage] = useState<PublicPageConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [workshop, setWorkshop] = useState<JourneyRecord | null>(null);
  const [dead, setDead] = useState(false);
  const [problem, setProblem] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [unavailable, setUnavailable] = useState(false);

  const workshopId = useMemo(() => linkedId(), []);

  useEffect(() => {
    let alive = true;
    setProblem(false);
    loadPublicPagesConfig(SLUG)
      .then(async c => {
        if (!alive) return;
        const p = c?.pages[SLUG] ?? null;
        setCfg(c);
        setPage(p);
        if (!c || !p) { setUnavailable(true); return; }
        if (!workshopId) return;
        const appId = p.door_per_record?.app_id
          ?? p.endpoints?.find(e => e.entity === 'workshops')?.app_id;
        if (!appId) { setUnavailable(true); return; }
        try {
          const r = await getPublicRecord(c, p, appId, workshopId);
          if (alive) setWorkshop({ id: r.id, fields: r.fields, createdAt: r.created_at ?? null });
        } catch (e) {
          if (!alive) return;
          if (e instanceof PageUnavailableError) setDead(true);
          else setProblem(true);
        }
      })
      .catch(() => { if (alive) setUnavailable(true); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [workshopId, reloadKey]);

  const port = useMemo(() => (cfg && page ? createPublicPort(cfg, page) : null), [cfg, page]);

  if (loading) return <PublicShell loading />;
  if (unavailable || !cfg || !page || !port) return <PublicShell unavailable />;

  if (!workshopId) {
    return (
      <PublicShell title={tx('Workshop-Anmeldung')}>
        <p className="text-sm text-muted-foreground">
          {tx('Bitte öffne die Anmeldung über den Link oder QR-Code zu deinem Workshop.')}
        </p>
      </PublicShell>
    );
  }
  if (dead) {
    return (
      <PublicShell title={tx('Workshop-Anmeldung')}>
        <p className="text-sm">
          {tx('Dieser Link ist nicht mehr gültig. Bitte den aktuellen Link oder QR-Code verwenden.')}
        </p>
      </PublicShell>
    );
  }
  if (problem) {
    return (
      <PublicShell title={tx('Workshop-Anmeldung')}>
        <LoadProblem onRetry={() => setReloadKey(k => k + 1)} />
      </PublicShell>
    );
  }

  return (
    <RegistrationForm
      cfg={cfg}
      page={page}
      port={port}
      workshop={workshop}
      workshopId={workshopId}
    />
  );
}

function RegistrationForm({ cfg, page, port, workshop, workshopId }: {
  cfg: PublicPagesConfig;
  page: PublicPageConfig;
  port: ReturnType<typeof createPublicPort>;
  workshop: JourneyRecord | null;
  workshopId: string;
}) {
  const f = useStepForm('anmeldungen', {
    fields: ['vorname', 'nachname', 'email', 'frage'],
    autoComplete: true,
  });
  const submit = useJourneySubmit(
    port,
    [{ key: 'anmeldung', entity: 'anmeldungen', form: f, primary: true }],
    { draftKey: `workshop-anmelden-${workshopId}` },
  );

  const title = workshop ? fieldText(workshop, 'titel') : '';
  const datum = workshop ? fieldText(workshop, 'datum') : '';
  const ort = workshop ? fieldText(workshop, 'ort') : '';

  const touch = () => {
    const ep = page.endpoints?.find(e => e.op === 'create');
    if (ep) prepareChallenge(cfg, page, 'POST', `/apps/${ep.app_id}/records`);
  };

  const send = async () => {
    if (!f.validate()) return;
    await submit.run();
  };

  const head = (
    <div className="mb-5 rounded-xl border bg-muted/40 p-4 space-y-1.5">
      <p className="text-base font-semibold break-words">{title}</p>
      {datum && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <IconCalendar size={16} className="shrink-0" />
          <span>{datum}</span>
        </p>
      )}
      {ort && (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <IconMapPin size={16} className="shrink-0" />
          <span className="break-words">{ort}</span>
        </p>
      )}
    </div>
  );

  if (submit.result) {
    return (
      <PublicShell title={tx('Workshop-Anmeldung')}>
        {head}
        <div data-journey-success="" className="flex flex-col items-center gap-3 py-4 text-center">
          <IconCircleCheck size={48} className="text-emerald-600" />
          <p className="text-lg font-semibold">{tx('Danke, du bist angemeldet!')}</p>
          <p className="text-sm text-muted-foreground">
            {tx('Wir haben deine Anmeldung erhalten. Deine Frage geht an die Referentin.')}
          </p>
          <Button
            type="button"
            variant="outline"
            className="min-h-11"
            data-journey-again=""
            onClick={() => { submit.reset(); f.reset(); }}
          >
            {tx('Weitere Person anmelden')}
          </Button>
        </div>
      </PublicShell>
    );
  }

  return (
    <PublicShell title={tx('Workshop-Anmeldung')}>
      {head}
      <form
        className="space-y-5"
        noValidate
        onFocus={touch}
        onSubmit={e => { e.preventDefault(); void send(); }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Bound form={f} name="vorname" />
          <Bound form={f} name="nachname" />
        </div>
        <Bound form={f} name="email" />
        <Bound form={f} name="frage" rows={4} />
        <FieldErrorSummary forms={[f]} />
        {submit.error && (
          <p className="text-sm text-destructive">
            {submit.offline
              ? tx('Keine Verbindung — deine Eingaben sind gesichert.')
              : tx('Das hat nicht geklappt. Bitte versuche es noch einmal.')}
          </p>
        )}
        <Button type="submit" className="w-full min-h-11" disabled={submit.submitting}>
          {tx('Verbindlich anmelden')}
        </Button>
      </form>
    </PublicShell>
  );
}
