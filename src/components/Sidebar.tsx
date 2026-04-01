import { AircraftSelector } from './AircraftSelector';
import { UnitToggle } from './UnitToggle';
import { PayloadFuelSliders } from './PayloadFuelSliders';
import { WindSlider } from './WindSlider';
import { MissionPanel } from './MissionPanel';
import { ResultsPanel } from './ResultsPanel';

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>RJ Mission Map</h1>
        <p className="sidebar-subtitle">ZRJ Family Range Analysis</p>
      </div>

      <div className="sidebar-content">
        <AircraftSelector />
        <UnitToggle />
        <PayloadFuelSliders />
        <WindSlider />
        <MissionPanel />
        <ResultsPanel />
      </div>
    </aside>
  );
}
