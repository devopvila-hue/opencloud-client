import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DepartmentCard } from '@/components/DepartmentCard';
import type { DepartmentCatalogEntry } from '@/api/schemas';

function renderCard(entry: DepartmentCatalogEntry, to?: string) {
  return render(
    <MemoryRouter>
      <DepartmentCard entry={entry} to={to} />
    </MemoryRouter>,
  );
}

const entry: DepartmentCatalogEntry = {
  key: 'growth',
  name: 'Growth',
  version: '1.1.0',
  category: 'revenue',
  description: 'Growth strategy and audience development.',
  icon: 'rocket',
  manager_agent_id: 'growth-manager',
  capabilities: ['strategy'],
  dependencies: [],
  permissions: [],
  configuration_schema: {},
  metadata: {},
  license: null,
  installation: {
    id: 'i',
    organization_id: 'o',
    department_key: 'growth',
    lifecycle: 'active',
    health: 'healthy',
    configuration: {},
    activated_at: new Date(Date.now() - 3600_000).toISOString(),
    deactivated_at: null,
    last_error: null,
    workspace_path: null,
    installed_version: '1.1.0',
    activated_version: '1.1.0',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  manager: { agent_id: 'growth-manager', status: 'active', last_seen_at: new Date().toISOString() },
  last_health: { status: 'healthy', checked_at: new Date().toISOString(), duration_ms: 80 },
};

describe('DepartmentCard', () => {
  it('shows name, description and version', () => {
    renderCard(entry, '/departments/growth');
    expect(screen.getByText('Growth')).toBeInTheDocument();
    expect(screen.getByText(/Growth strategy/)).toBeInTheDocument();
    expect(screen.getByText(/v1\.1\.0/)).toBeInTheDocument();
  });

  it('renders the lifecycle badge', () => {
    renderCard(entry, '/departments/growth');
    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('healthy')).toBeInTheDocument();
  });

  it('shows the available lifecycle for an un-installed entry', () => {
    const available = { ...entry, installation: null };
    renderCard(available, '/departments/growth');
    expect(screen.getByText('available')).toBeInTheDocument();
  });
});
