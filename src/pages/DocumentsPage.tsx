import { useState } from 'react';
import { FileText, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/Button';
import { Card, CardHeader } from '@/components/Card';
import { PageHeader } from '@/components/PageHeader';
import { Dialog } from '@/components/Dialog';
import { EmptyState } from '@/components/EmptyState';
import { Field } from '@/components/Field';
import { Badge } from '@/components/Badge';
import { useToast } from '@/components/Toaster';
import { useDeleteDocument, useDocuments, useUploadDocument } from '@/api/queries';
import { formatBytes, formatRelativeTime } from '@/utils/format';
import { useI18n } from '@/i18n/I18nProvider';

const ACCEPT = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain', 'text/markdown'];

export default function DocumentsPage() {
  const { t } = useI18n();
  const docs = useDocuments();
  const upload = useUploadDocument();
  const del = useDeleteDocument();
  const toast = useToast();
  const [uploadOpen, setUploadOpen] = useState(false);

  async function onUpload(file: File) {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const b64 = (reader.result as string).split(',')[1];
        await upload.mutateAsync({
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          contentBase64: b64,
        });
        toast.push({ tone: 'success', title: t('documents.toast.uploaded'), description: file.name });
        setUploadOpen(false);
      } catch (e) {
        toast.push({ tone: 'error', title: t('documents.toast.upload_failed'), description: (e as Error).message });
      }
    };
    reader.readAsDataURL(file);
  }

  function onDelete(id: string, name: string) {
    if (!confirm(t('documents.confirm_delete', { name }))) return;
    del.mutate(id, {
      onSuccess: () => toast.push({ tone: 'success', title: t('documents.toast.deleted') }),
      onError: (e: Error) => toast.push({ tone: 'error', title: t('documents.toast.delete_failed'), description: e.message }),
    });
  }

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title={t('documents.header.title')}
        subtitle={t('documents.header.subtitle')}
        action={
          <Button variant="primary" iconLeft={<Upload className="h-4 w-4" />} onClick={() => setUploadOpen(true)}>
            {t('documents.upload.cta')}
          </Button>
        }
      />

      {docs.isLoading ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="shimmer h-28 rounded-[var(--radius-lg)]" />
          ))}
        </div>
      ) : (docs.data ?? []).length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title={t('documents.empty.title')}
          description={t('documents.empty.desc')}
          action={<Button onClick={() => setUploadOpen(true)}>{t('documents.upload.cta')}</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(docs.data ?? []).map((d) => (
            <Card key={d.id} padding="md">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-bg-3)]">
                  <FileText className="h-4 w-4 text-[color:var(--color-fg-2)]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-[color:var(--color-fg-1)]">{d.filename}</div>
                  <div className="text-xs text-[color:var(--color-fg-3)]">
                    {formatBytes(d.file_size)} · {formatRelativeTime(d.uploaded_at)}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge tone={d.status === 'failed' ? 'rose' : 'emerald'} size="xs">
                      {d.status}
                    </Badge>
                    <code className="font-mono text-[10px] text-[color:var(--color-fg-3)]">{d.sha256.slice(0, 8)}…</code>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex items-center justify-end">
                <Button
                  size="sm"
                  variant="ghost"
                  iconLeft={<Trash2 className="h-3.5 w-3.5" />}
                  onClick={() => onDelete(d.id, d.filename)}
                  loading={del.isPending}
                >
                  {t('documents.action.delete')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <UploadDialog open={uploadOpen} onClose={() => setUploadOpen(false)} onPick={onUpload} loading={upload.isPending} />
    </div>
  );
}

function UploadDialog({
  open,
  onClose,
  onPick,
  loading,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (f: File) => void;
  loading: boolean;
}) {
  const { t } = useI18n();
  const [name, setName] = useState('');
  const [file, setFile] = useState<File | null>(null);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={t('documents.upload.title')}
      description={t('documents.dialog.hint')}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>{t('documents.dialog.cancel')}</Button>
          <Button
            variant="primary"
            iconLeft={<Upload className="h-4 w-4" />}
            disabled={!file}
            loading={loading}
            onClick={() => file && onPick(file)}
          >
            {t('documents.dialog.upload')}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Field
          label={t('documents.dialog.display_name')}
          placeholder={file?.name ?? 'report.pdf'}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <label
          className="flex h-32 cursor-pointer flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[color:var(--color-line-strong)] bg-[color:var(--color-bg-2)] text-sm text-[color:var(--color-fg-3)] hover:border-[color:var(--color-accent)]"
        >
          {file ? (
            <span>
              <strong className="text-[color:var(--color-fg-1)]">{file.name}</strong> · {formatBytes(file.size)}
            </span>
          ) : (
            <span>{t('documents.upload.drop')}</span>
          )}
          <input
            type="file"
            accept={ACCEPT.join(',')}
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>
      </div>
    </Dialog>
  );
}