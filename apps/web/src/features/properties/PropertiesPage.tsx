import { useState } from 'react';
import { Link } from 'react-router-dom';
import { trpc } from '../../lib/trpc';

export function PropertiesPage() {
  const { data: properties, isLoading } = trpc.properties.list.useQuery();
  const utils = trpc.useUtils();
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  const createProperty = trpc.properties.create.useMutation({
    onSuccess: () => {
      utils.properties.list.invalidate();
      setShowForm(false);
      setName('');
      setAddress('');
    },
  });

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading properties...</div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
        >
          {showForm ? 'Cancel' : 'Add Property'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createProperty.mutate({ name, address: address || undefined });
          }}
          className="mb-6 p-4 bg-white rounded-lg shadow space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. 123 Main Street House"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Address</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. 123 Main Street, City"
            />
          </div>
          <button
            type="submit"
            disabled={createProperty.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium disabled:opacity-50"
          >
            {createProperty.isPending ? 'Creating...' : 'Create Property'}
          </button>
        </form>
      )}

      {(!properties || properties.length === 0) ? (
        <div className="text-center py-12 text-gray-500">
          <p>No properties yet. Add your first property to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {properties.map((property) => (
            <Link
              key={property.id}
              to={`/properties/${property.id}`}
              className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <h2 className="text-lg font-semibold text-gray-900">{property.name}</h2>
              {property.address && (
                <p className="mt-1 text-sm text-gray-500">{property.address}</p>
              )}
              <p className="mt-2 text-xs text-gray-400">
                Created {new Date(property.createdAt).toLocaleDateString()}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
