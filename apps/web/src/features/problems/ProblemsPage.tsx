import { useState } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
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

export function ProblemsPage() {
  const { t } = useTranslation();
  const { propertyId, phaseId } = useParams<{ propertyId: string; phaseId: string }>();
  const [searchParams] = useSearchParams();

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [room, setRoom] = useState('');
  const [locationDetail, setLocationDetail] = useState('');
  const [severity, setSeverity] = useState<string>('medium');
  const [fixByDate, setFixByDate] = useState('');

  const [filterStatus, setFilterStatus] = useState<string>(searchParams.get('status') || '');
  const [filterSeverity, setFilterSeverity] = useState<string>('');
  const [filterRoom, setFilterRoom] = useState<string>('');

  const { data: phase } = trpc.phases.byId.useQuery(
    { id: phaseId! },
    { enabled: !!phaseId }
  );
  const { data: property } = trpc.properties.byId.useQuery(
    { id: propertyId! },
    { enabled: !!propertyId }
  );
  const { data: problems, isLoading } = trpc.problems.list.useQuery(
    {
      propertyId: propertyId!,
      phaseId: phaseId,
      ...(filterStatus ? { status: filterStatus as any } : {}),
      ...(filterSeverity ? { severity: filterSeverity as any } : {}),
      ...(filterRoom ? { room: filterRoom } : {}),
    },
    { enabled: !!propertyId }
  );
  const utils = trpc.useUtils();

  const createProblem = trpc.problems.create.useMutation({
    onSuccess: () => {
      utils.problems.list.invalidate();
      setShowForm(false);
      setTitle('');
      setDescription('');
      setRoom('');
      setLocationDetail('');
      setSeverity('medium');
      setFixByDate('');
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

  // Get unique rooms for filter
  const rooms = problems
    ? [...new Set(problems.map((p) => p.room))].sort()
    : [];

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">{t('common.loading')}</div>;
  }

  return (
    <div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
        <Link to="/" className="hover:text-blue-600">{t('properties.title')}</Link>
        <span>/</span>
        <Link to={`/properties/${propertyId}`} className="hover:text-blue-600">{property?.name ?? '...'}</Link>
        <span>/</span>
        <span className="text-gray-900">{phase?.name ?? '...'}</span>
      </div>

      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-900">{t('problems.title')}</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium"
        >
          {showForm ? t('common.cancel') : t('problems.addProblem')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:border-blue-500 focus:outline-none"
        >
          <option value="">{t('problems.allStatuses')}</option>
          <option value="open">{t('problems.statusOpen')}</option>
          <option value="in_progress">{t('problems.statusInProgress')}</option>
          <option value="resolved">{t('problems.statusResolved')}</option>
          <option value="verified">{t('problems.statusVerified')}</option>
          <option value="wont_fix">{t('problems.statusWontFix')}</option>
        </select>
        <select
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:border-blue-500 focus:outline-none"
        >
          <option value="">{t('problems.allSeverities')}</option>
          <option value="minor">{t('problems.severityMinor')}</option>
          <option value="medium">{t('problems.severityMedium')}</option>
          <option value="high">{t('problems.severityHigh')}</option>
          <option value="critical">{t('problems.severityCritical')}</option>
        </select>
        {rooms.length > 0 && (
          <select
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
            className="text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:border-blue-500 focus:outline-none"
          >
            <option value="">{t('problems.allRooms')}</option>
            {rooms.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createProblem.mutate({
              phaseId: phaseId!,
              propertyId: propertyId!,
              title,
              description: description || undefined,
              room,
              locationDetail: locationDetail || undefined,
              severity: severity as any,
              fixByDate: fixByDate || undefined,
            });
          }}
          className="mb-6 p-4 bg-white rounded-lg shadow space-y-3"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('problems.problemTitle')}</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={t('problems.titlePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('problems.room')}</label>
              <input
                type="text"
                required
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={t('problems.roomPlaceholder')}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('problems.description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder={t('problems.descriptionPlaceholder')}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('problems.locationDetail')}</label>
              <input
                type="text"
                value={locationDetail}
                onChange={(e) => setLocationDetail(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder={t('problems.locationPlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('problems.severity')}</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="minor">{t('problems.severityMinor')}</option>
                <option value="medium">{t('problems.severityMedium')}</option>
                <option value="high">{t('problems.severityHigh')}</option>
                <option value="critical">{t('problems.severityCritical')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('problems.fixByDate')}</label>
              <input
                type="date"
                value={fixByDate}
                onChange={(e) => setFixByDate(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={createProblem.isPending}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm font-medium disabled:opacity-50"
          >
            {createProblem.isPending ? t('common.creating') : t('problems.addProblem')}
          </button>
          {createProblem.error && (
            <p className="text-sm text-red-600">{createProblem.error.message}</p>
          )}
        </form>
      )}

      {/* Problem list */}
      {(!problems || problems.length === 0) ? (
        <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow">
          <p>{t('problems.noProblems')}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {problems.map((problem) => (
            <Link
              key={problem.id}
              to={`/properties/${propertyId}/phases/${phaseId}/problems/${problem.id}`}
              className="block p-4 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 truncate">{problem.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{problem.room}{problem.locationDetail ? ` — ${problem.locationDetail}` : ''}</p>
                  {problem.description && (
                    <p className="text-sm text-gray-400 mt-1 line-clamp-2">{problem.description}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1 ml-4 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${SEVERITY_COLORS[problem.severity]}`}>
                    {severityLabel(problem.severity)}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[problem.status]}`}>
                    {statusLabel(problem.status)}
                  </span>
                </div>
              </div>
              <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
                <span>{problem.reportedByUser?.name}</span>
                <span>{new Date(problem.createdAt).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
