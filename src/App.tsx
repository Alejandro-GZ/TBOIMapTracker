import { useRef } from 'react';
import { DIMENSIONS } from './domain/catalog';
import { parseTrackerDocument } from './domain/serialization';
import { RoomInspector } from './components/RoomInspector';
import { MapGrid } from './components/MapGrid';
import { RoomPalette } from './components/RoomPalette';
import { useTrackerStore } from './store/useTrackerStore';

const safeFilename = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tboi-map';

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const document = useTrackerStore((state) => state.document);
  const activeDimension = useTrackerStore((state) => state.activeDimension);
  const setActiveDimension = useTrackerStore((state) => state.setActiveDimension);
  const setDocumentMeta = useTrackerStore((state) => state.setDocumentMeta);
  const loadDocument = useTrackerStore((state) => state.loadDocument);
  const newDocument = useTrackerStore((state) => state.newDocument);
  const showIndices = useTrackerStore((state) => state.showIndices);
  const setShowIndices = useTrackerStore((state) => state.setShowIndices);

  const roomCount = document.dimensions[activeDimension].length;
  const pickupCount = document.dimensions[activeDimension].reduce(
    (sum, room) => sum + room.pickups.reduce((roomSum, pickup) => roomSum + pickup.quantity, 0),
    0,
  );

  const exportDocument = () => {
    const blob = new Blob([JSON.stringify(document, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = window.document.createElement('a');
    anchor.href = url;
    anchor.download = `${safeFilename(document.name)}.tboimap.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importDocument = async (file: File) => {
    try {
      const parsed = parseTrackerDocument(await file.text());
      loadDocument(parsed);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not import that file.');
    }
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark">M</div>
          <div>
            <strong>TBOI MAP TRACKER</strong>
            <span>Repentance+ minimap memory</span>
          </div>
        </div>

        <div className="run-meta">
          <input
            className="run-name"
            value={document.name}
            onChange={(event) => setDocumentMeta({ name: event.target.value })}
            aria-label="Run name"
            placeholder="Run"
          />
          <input
            value={document.floor}
            onChange={(event) => setDocumentMeta({ floor: event.target.value })}
            aria-label="Floor name"
            placeholder="Floor"
          />
          <input
            value={document.seed}
            onChange={(event) => setDocumentMeta({ seed: event.target.value.toUpperCase() })}
            aria-label="Seed"
            placeholder="Seed"
          />
        </div>

        <div className="top-actions">
          <button type="button" onClick={() => setShowIndices(!showIndices)} className={showIndices ? 'active-button' : ''}>Grid</button>
          <button type="button" onClick={() => fileInputRef.current?.click()}>Import</button>
          <button type="button" onClick={exportDocument}>Export</button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Start a fresh map? Your current map is already autosaved in this browser.')) newDocument();
            }}
          >
            New
          </button>
          <input
            ref={fileInputRef}
            className="hidden-input"
            type="file"
            accept="application/json,.json"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importDocument(file);
              event.currentTarget.value = '';
            }}
          />
        </div>
      </header>

      <nav className="dimension-bar" aria-label="Level dimension">
        <span className="dimension-label">Map layer</span>
        {DIMENSIONS.map((dimension) => (
          <button
            type="button"
            key={dimension.id}
            className={activeDimension === dimension.id ? 'active' : ''}
            onClick={() => setActiveDimension(dimension.id)}
          >
            <b>{dimension.short}</b>
            <span>{dimension.label}</span>
            <small>{document.dimensions[dimension.id].length}</small>
          </button>
        ))}
        <span className="autosave-state">● saved locally</span>
      </nav>

      <main className="workspace">
        <RoomPalette />
        <MapGrid />
        <RoomInspector />
      </main>

      <footer className="footer-bar">
        <span>{roomCount} rooms</span>
        <span>{pickupCount} pickups tracked</span>
        <span>13×13 · {DIMENSIONS.find((dimension) => dimension.id === activeDimension)?.short}</span>
        <span className="footer-note">Pinned MiniMAPI sprite skin · manual floor tracker</span>
      </footer>
    </div>
  );
}
