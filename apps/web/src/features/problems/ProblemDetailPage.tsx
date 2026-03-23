import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { trpc } from '../../lib/trpc';

const SEVERITY_COLORS: Record<string, string> = {
  minor: 'bg-gray-100 text-gray-700',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800',
};

const STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-100 text-red-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  verified: 'bg-emerald-100 text-emerald-800',
  wont_fix: 'bg-gray-100 text-gray-600',
};

const ALL_STATUSES = ['open', 'in_progress', 'resolved', 'verified', 'wont_fix'] as const;

export function ProblemDetailPage() {
  const { t } = useTranslation();
  const { propertyId, phaseId, problemId } = useParams<{
    propertyId: string;
    phaseId: string;
    problemId: string;
  }>();

  const [commentBody, setCommentBody] = useState('');
  const [isResolution, setIsResolution] = useState(false);

  const { data: problem, isLoading } = trpc.problems.byId.useQuery(
    { id: problemId! },
    { enabled: !!problemId }
  );
  const { data: phase } = trpc.phases.byId.useQuery(
    { id: phaseId! },
    { enabled: !!phaseId }
  );
  const { data: property } = trpc.properties.byId.useQuery(
    { id: propertyId! },
    { enabled: !!propertyId }
  );
  const { data: comments } = trpc.comments.list.useQuery(
    { problemId: problemId! },
    { enabled: !!problemId }
  );
  const utils = trpc.useUtils();

  const updateStatus = trpc.problems.updateStatus.useMutation({
    onSuccess: () => {
      utils.problems.byId.invalidate({ id: problemId! });
      utils.problems.list.invalidate();
    },
  });

  const addComment = trpc.comments.create.useMutation({
    onSuccess: () => {
      utils.comments.list.invalidate({ problemId: problemId! });
      setCommentBody('');
      setIsResolution(false);
    },
  });

  const deleteComment = trpc.comments.delete.useMutation({
    onSuccess: () => {
      utils.comments.list.invalidate({ problemId: problemId! });
    },
  });

  const severityLabel = (s: string) => {
    const map: Record<string, string> = {
      minor: t('problems.severityMinor'),
      medium: t('problems.severityMedium'),
      high: t('problems.severityHigh'),
      critical: t('problems.severityCritical'),
    };
    return map[s] ?? s;
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      open: t('problems.statusOpen'),
      in_progress: t('problems.statusInProgress'),
      resolved: t('problems.statusResolved'),
      verified: t('problems.statusVerified'),
      wont_fix: t('problems.statusWontFix'),
    };
    return map[s] ?? s;
  };

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>;
  }

  if (!problem) {
    return <div className="text-center py-12 text-gray-500">Problem not found</div>;
  }

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to="/" className="hover:text-blue-600">{t('properties.title')}</Link>
        <span>/</span>
        <Link to={`/properties/${propertyId}`} className="hover:text-blue-600">{property?.name ?? '...'}</Link>
        <span>/</span>
        <Link to={`/properties/${propertyId}/phases/${phaseId}/problems`} className="hover:text-blue-600">{phase?.name ?? '...'}</Link>
        <span>/</span>
        <span className="text-gray-900 truncate">{problem.title}</span>
      </div>

      {/* Problem detail card */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{problem.title}</h1>
          <div className="flex gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${SEVERITY_COLORS[problem.severity]}`}>
              {severityLabel(problem.severity)}
            </span>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[problem.status]}`}>
              {statusLabel(problem.status)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">{t('problems.room')}:</span>{' '}
            <span className="text-gray-900">{problem.room}</span>
          </div>
          {problem.locationDetail && (
            <div>
              <span className="text-gray-500">{t('problems.locationDetail')}:</span>{' '}
              <span className="text-gray-900">{problem.locationDetail}</span>
            </div>
          )}
          <div>
            <span className="text-gray-500">{t('problems.reportedBy')}:</span>{' '}
            <span className="text-gray-900">{problem.reportedByUser?.name}</span>
          </div>
          {problem.fixByDate && (
            <div>
              <span className="text-gray-500">{t('problems.fixByDate')}:</span>{' '}
              <span className="text-gray-900">{new Date(problem.fixByDate).toLocaleDateString()}</span>
            </div>
          )}
        </div>

        {problem.description && (
          <div className="mt-4">
            <p className="text-gray-700 whitespace-pre-wrap">{problem.description}</p>
          </div>
        )}

        {/* Status change */}
        <div className="mt-6 pt-4 border-t">
          <label className="block text-sm font-medium text-gray-700 mb-2">{t('problems.changeStatus')}</label>
          <div className="flex flex-wrap gap-2">
            {ALL_STATUSES.map((s) => (
              <button
                key={s}
                disabled={problem.status === s || updateStatus.isPending}
                onClick={() => updateStatus.mutate({ id: problem.id, status: s })}
                className={`px-3 py-1 rounded-md text-xs font-medium border transition-colors disabled:opacity-40 ${
                  problem.status === s
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400 text-gray-700'
                }`}
              >
                {statusLabel(s)}
              </button>
            ))}
          </div>
          {updateStatus.error && (
            <p className="text-sm text-red-600 mt-2">{updateStatus.error.message}</p>
          )}
        </div>
      </div>

      {/* Comments section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('comments.title')}</h2>

        {(!comments || comments.length === 0) ? (
          <p className="text-gray-500 text-sm mb-4">{t('comments.noComments')}</p>
        ) : (
          <div className="space-y-4 mb-6">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`p-3 rounded-lg border ${
                  comment.isResolution
                    ? 'border-green-300 bg-green-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{comment.author?.name}</span>
                    {comment.isResolution && (
                      <span className="px-1.5 py-0.5 rounded text-xs font-medium bg-green-200 text-green-800">
                        {t('comments.resolution')}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">
                      {new Date(comment.createdAt).toLocaleString()}
                    </span>
                    <button
                      onClick={() => {
                        if (confirm(t('comments.confirmDelete'))) {
                          deleteComment.mutate({ id: comment.id });
                        }
                      }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      {t('comments.deleteComment')}
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{comment.body}</p>
              </div>
            ))}
          </div>
        )}

        {/* Add comment form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            addComment.mutate({
              problemId: problemId!,
              body: commentBody,
              isResolution,
            });
          }}
          className="space-y-3"
        >
          <textarea
            value={commentBody}
            onChange={(e) => setCommentBody(e.target.value)}
            rows={3}
            required
            className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
            placeholder={t('comments.commentPlaceholder')}
          />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={isResolution}
                onChange={(e) => setIsResolution(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              {t('comments.markResolution')}
            </label>
            <button
              type="submit"
              disabled={addComment.isPending || !commentBody.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
            >
              {addComment.isPending ? t('common.creating') : t('comments.addComment')}
            </button>
          </div>
          {addComment.error && (
            <p className="text-sm text-red-600">{addComment.error.message}</p>
          )}
        </form>
      </div>
    </div>
  );
}
