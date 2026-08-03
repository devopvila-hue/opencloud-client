import { Link } from 'react-router-dom';
import {
  Activity,
  ChevronRight,
  Clock,
  Loader2,
  Pin,
} from 'lucide-react';
import { Card, CardHeader, CardSection } from '@/components/Card';
import { Badge, Dot } from '@/components/Badge';
import { EmptyState } from '@/components/EmptyState';
import { useTimeline } from '@/api/queries';
import { formatRelativeTime, formatDateTime } from '@/utils/format';
import { useI18n } from '@/i18n/I18nProvider';

const EVENT_TYPE_COLORS: Record<string, string> = {
  'orchestration.created': 'var(--color-info)',
  'orchestration.started': 'var(--color-info)',
  'orchestration.completed': 'var(--color-success)',
  'orchestration.failed': 'var(--color-danger)',
  'orchestration.cancelled': 'var(--color-text-muted)',
  'orchestration.escalated': 'var(--color-warning)',
  'step.started': 'var(--color-info)',
  'step.completed': 'var(--color-success)',
  'step.failed': 'var(--color-danger)',
  'step.cancelled': 'var(--color-text-muted)',
  'bus.message': 'var(--color-warning)',
};

export default function TimelinePage() {
  const { t } = useI18n();
  const { data, isLoading } = useTimeline();

  if (isLoading) {
    return (
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
        <div className="flex items-center gap-3 text-text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>{t('timeline.loading')}</span>
        </div>
      </div>
    );
  }

  const events = data ?? [];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)]"
            style={{
              backgroundColor: 'color-mix(in oklab, var(--color-info) 80%, transparent)',
              color: 'var(--color-info)',
            }}
          >
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{t('nav.timeline')}</h1>
            <p className="text-sm text-text-muted">
              {t('timeline.header.subtitle')}
            </p>
          </div>
        </div>
        <Badge tone="accent">Phase 6</Badge>
      </header>

      <Card>
        <CardHeader
          title={t('timeline.events.title')}
          subtitle={
            events.length === 1
              ? t('timeline.events.subtitle_one')
              : t('timeline.events.subtitle_other', { count: events.length })
          }
        />
        <CardSection>
          {events.length === 0 ? (
            <EmptyState
              title={t('timeline.events.empty.title')}
              description={t('timeline.events.empty.desc')}
            />
          ) : (
            <div className="relative ml-3 border-l border-border">
              {events.map((e, idx) => (
                <div key={`${e.at}-${idx}`} className="relative mb-4 pl-6">
                  <span
                    className="absolute -left-1.5 top-1 h-3 w-3 rounded-full"
                    style={{
                      backgroundColor:
                        EVENT_TYPE_COLORS[e.type] ?? 'var(--color-text-muted)',
                    }}
                  />
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="text-text-muted">
                      <Clock className="mr-1 inline h-3 w-3" />
                      {formatDateTime(e.at)}
                    </span>
                    <span className="text-text-muted">{formatRelativeTime(e.at)}</span>
                    <Badge tone="neutral">{e.type}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1 text-sm">
                    <span className="font-medium">{e.source}</span>
                    <span className="text-text-muted">{t('timeline.events.in')}</span>
                    <span className="font-medium">{e.source_department}</span>
                    {e.target_department && (
                      <>
                        <ChevronRight className="h-3 w-3 text-text-muted" />
                        <span className="font-medium">{e.target}</span>
                        <span className="text-text-muted">{t('timeline.events.in')}</span>
                        <span className="font-medium">{e.target_department}</span>
                      </>
                    )}
                  </div>
                  {e.subject && (
                    <p className="mt-1 text-sm">
                      <Pin className="mr-1 inline h-3 w-3 text-text-muted" />
                      {e.subject}
                    </p>
                  )}
                  {e.detail && (
                    <p className="mt-1 line-clamp-2 text-xs text-text-muted">{e.detail}</p>
                  )}
                  {e.orchestration_id && (
                    <Link
                      to={`/orchestrations/${e.orchestration_id}`}
                      className="mt-1 inline-block text-xs text-info underline"
                    >
                      {t('timeline.events.link')}
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardSection>
      </Card>
    </div>
  );
}
