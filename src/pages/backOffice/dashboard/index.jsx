import React from 'react'
import DashboardEventTable from './dashboardEventTable';

// Full-bleed page (see fullBleed in backOfficeLayout): just the event table, no title.
export default function Dashboard() {
  return <DashboardEventTable />;
}
