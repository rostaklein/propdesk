import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { trpc } from '../../lib/trpc';

const STATUS_COLORS: Record<string, string> = {
  upcoming: 'bg-gray-100 text-gray-700',
  active: 'bg-blue-100 text-blue-700',
  completed: 'bg-green-100 text-green-700',
};

export function PropertyDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: property, isLoading: loadingProperty } = trpc.properties.byId.useQuery(
    { id: id! },
    { enabled: !!id }
  );
  const { data: phases, isLoading: loadingPhases } = trpc.phases.list.useQuery(
    { propertyId: id! },
    { enabled: !!id }
  );
  const utils = trpc.useUtils();

  const [showForm, setShowForm] = useState(false);
  const [phaseName, setPhaseName] = useState('');

  const createPhase = trpc.phases.create.useMutation({
    onSuccess: () => {
      utils.phases.list.invalidate();
      setShowForm(false);
      setPhaseName('');
    },
  });

  if (loadingProperty || loadingPhases) {
    return <div className="text-center py-12 text-gray-500">Loading...</div>;
  }

  if (!property) {
    return <div className="text-center py-12 text-gray-500">Property not found</div>;
  }

  return (
    <div>
      <Link to="/" className="text-blue-600 hover:text-blue-500 text-sm mb-4 inline-block">
        &larr; Back to Properties
      </Link>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">{property.name}</h1>
        {property.address && <p className="text-gray-500 mt-1">{property.address}</p>}
      </div>

      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Phases</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          {showForm ? 'Cancel' : 'Add Phase'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createPhase.mutate({
              propertyId: id!,
              name: phaseName,
              sortOrder: phases?.length ?? 0,
            });
          }}
          className="mb-4 p-4 bg-white rounded-lg shadow space-y-3"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">Phase Name</label>
            <input
              type="text"
              required
              value={phaseName}
              onChange={(e) => setPhaseName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Interior Phase 1"
            />
          </div>
          <button
            type="submit"
            disabled={createPhase.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
          >
            {createPhase.isPending ? 'Creating...' : 'Create Phase'}
          </button>
        </form>
      )}

      {(!phases || phases.length === 0) ? (
        <div className="text-center py-8 text-gray-500 bg-white rounded-lg shadow">
          <p>No phases yet. Add a phase to organize inspections.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {phases.map((phase) => (
            <div
              key={phase.id}
              className="p-4 bg-white rounded-lg shadow flex justify-between items-center"
            >
              <div>
                <h3 className="font-medium text-gray-900">{phase.name}</h3>
                <span
                  className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[phase.status] ?? ''}`}
                >
                  {phase.status}
                </span>
              </div>
              <span className="text-sm text-gray-400">#{phase.sortOrder + 1}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
