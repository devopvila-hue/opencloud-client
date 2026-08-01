import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileText } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Badge } from '@/components/Badge';
import { useMemoryFile, useMemoryList } from '@/api/queries';
import { formatDateTime, formatRelativeTime } from '@/utils/format';

export default function MemoryFilePage() {
  const params = useParams<{ key: string }>();
  const key = params.key ?? '';
  const file = useMemoryFile(key);
  const list = useMemoryList();
  const meta = (list.data ?? []).find((m) => m.file_key === key);

  if (file.isLoading) {
    return <div className="mx-auto w-full max-w-4xl p-6"><div className="shimmer h-64 rounded-[var(--radius-lg)]" /></div>;
  }
  if (file.isError || !file.data) {
    return (
      <div className="mx-auto w-full max-w-4xl p-6">
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="Memory file not found"
          description={`No file with key "${key}" exists for this company.`}
          action={<Link to="/company"><Button>Back to company</Button></Link>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 md:p-6 lg:p-8">
      <Link to="/company" className="inline-flex items-center gap-1 text-xs text-[color:var(--color-fg-3)] hover:text-[color:var(--color-fg-1)]">
        <ArrowLeft className="h-3 w-3" /> Back to company
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{file.data.title}</h1>
          <p className="mt-1 text-sm text-[color:var(--color-fg-3)]">
            v{file.data.version} · updated {formatRelativeTime(file.data.updated_at)} ({formatDateTime(file.data.updated_at)})
          </p>
        </div>
        <Badge tone="violet" size="sm" variant="outline">
          corporate memory
        </Badge>
      </header>
      <Card padding="md">
        <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed text-[color:var(--color-fg-1)]">
          {file.data.content}
        </pre>
      </Card>
      {meta && (
        <p className="text-[11px] text-[color:var(--color-fg-3)]">
          File key: <code>{meta.file_key}</code>
        </p>
      )}
    </div>
  );
}