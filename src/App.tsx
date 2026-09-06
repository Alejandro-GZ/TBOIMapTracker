import { useEffect, useRef, useState, type ReactNode } from 'react';
import { parseTrackerDocument } from './domain/serialization';
import { RoomInspector } from './components/RoomInspector';
import { MapGrid } from './components/MapGrid';
import { RoomPalette } from './components/RoomPalette';
import type { MapTool } from './domain/types';
import { useTrackerStore } from './store/useTrackerStore';

const safeFilename = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'tboi-map';

const APP_ICON_URL = '/TBOIMapTracker/app-icon.png';
const MOBILE_QUERY = '(max-width: 699px), (max-height: 500px) and (max-width: 950px)';

type MobileSheetId = 'rooms' | 'inspector' | 'run' | 'menu' | null;

function useMobileViewport() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(MOBILE_QUERY).matches,
  );

  useEffect(() => {
    const query = window.matchMedia(MOBILE_QUERY);
    const update = () => setIsMobile(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return isMobile;
}

function MobileIcon({ children }: { children: ReactNode }) {
  return (
    <svg className="mobile-toolbar-icon" viewBox="0 0 24 24" aria-hidden="true">
      {children}
    </svg>
  );
}

const MOBILE_TOOL_ICONS: Record<MapTool, ReactNode> = {
  move: (
    <MobileIcon>
      <path d="M12 2v20M2 12h20M12 2l-3 3m3-3 3 3M12 22l-3-3m3 3 3-3M2 12l3-3m-3 3 3 3M22 12l-3-3m3 3-3 3" />
    </MobileIcon>
  ),
  paint: (
    <MobileIcon>
      <path d="m4 17 1 3 3-1L19 8l-3-3L5 16l-1 1Zm10-10 3 3M4 20h6" />
    </MobileIcon>
  ),
  erase: (
    <MobileIcon>
      <path d="M4 15 14 5l6 6-8 8H8l-4-4Zm5 4-4-4M12 19h8" />
    </MobileIcon>
  ),
};

const ROOMS_ICON = (
  <MobileIcon>
    <path d="M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z" />
  </MobileIcon>
);

function MobileSheet({
  title,
  onClose,
  children,
  compact = false,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className="mobile-sheet-backdrop"
      data-testid="mobile-sheet-backdrop"
      onPointerDown={(event) => {
        if (event.currentTarget === event.target) onClose();
      }}
    >
      <section
        className={`mobile-sheet ${compact ? 'mobile-sheet-compact' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="mobile-sheet-handle" aria-hidden="true" />
        <div className="mobile-sheet-header">
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label={`Close ${title}`}>×</button>
        </div>
        <div className="mobile-sheet-body">{children}</div>
      </section>
    </div>
  );
}

function MobileBottomBar({
  mapTool,
  sheet,
  onTool,
  onRooms,
}: {
  mapTool: MapTool;
  sheet: MobileSheetId;
  onTool: (tool: MapTool) => void;
  onRooms: () => void;
}) {
  return (
    <nav className="mobile-bottom-bar" aria-label="Map editing tools" data-testid="mobile-bottom-bar">
      {(['move', 'paint', 'erase'] as const).map((tool) => (
        <button
          type="button"
          key={tool}
          className={mapTool === tool ? 'active' : ''}
          onClick={() => onTool(tool)}
          data-testid={`mobile-tool-${tool}`}
          aria-label={`${tool === 'move' ? 'Move' : tool === 'paint' ? 'Paint' : 'Erase'} rooms`}
        >
          {MOBILE_TOOL_ICONS[tool]}
          <span>{tool === 'move' ? 'Move' : tool === 'paint' ? 'Paint' : 'Erase'}</span>
        </button>
      ))}
      <button
        type="button"
        className={sheet === 'rooms' ? 'active' : ''}
        onClick={onRooms}
        data-testid="mobile-rooms-button"
        aria-label="Choose room type"
      >
        {ROOMS_ICON}
        <span>Rooms</span>
      </button>
    </nav>
  );
}

export default function App() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const document = useTrackerStore((state) => state.document);
  const activeDimension = useTrackerStore((state) => state.activeDimension);
  const selectedRoomId = useTrackerStore((state) => state.selectedRoomId);
  const mapTool = useTrackerStore((state) => state.mapTool);
  const showIndices = useTrackerStore((state) => state.showIndices);
  const setDocumentMeta = useTrackerStore((state) => state.setDocumentMeta);
  const loadDocument = useTrackerStore((state) => state.loadDocument);
  const newDocument = useTrackerStore((state) => state.newDocument);
  const setMapTool = useTrackerStore((state) => state.setMapTool);
  const setShowIndices = useTrackerStore((state) => state.setShowIndices);
  const isMobile = useMobileViewport();
  const [mobileSheet, setMobileSheet] = useState<MobileSheetId>(null);
  const [fitSignal, setFitSignal] = useState(0);

  const selectedRoom = document.dimensions[activeDimension].find((room) => room.id === selectedRoomId);

  useEffect(() => {
    if (!isMobile) setMobileSheet(null);
  }, [isMobile]);

  useEffect(() => {
    if (isMobile && mobileSheet === 'inspector' && !selectedRoomId) setMobileSheet(null);
  }, [isMobile, mobileSheet, selectedRoomId]);

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
      setMobileSheet(null);
      setFitSignal((value) => value + 1);
    } catch (error) {
      window.alert(error instanceof Error ? error.message : 'Could not import that file.');
    }
  };

  const startNewDocument = () => {
    if (window.confirm('Start a fresh map? Your current map is already autosaved in this browser.')) {
      newDocument();
      setMobileSheet(null);
      setFitSignal((value) => value + 1);
    }
  };

  const openFilePicker = () => {
    setMobileSheet(null);
    fileInputRef.current?.click();
  };

  return (
    <div className={`app-shell ${isMobile ? 'mobile-app-shell' : ''}`}>
      <div className="top-paper-frame">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">
              <img src={APP_ICON_URL} alt="" draggable={false} />
            </div>
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

          {isMobile && (
            <>
              <button
                type="button"
                className="mobile-run-summary"
                onClick={() => setMobileSheet('run')}
                data-testid="mobile-run-summary"
                aria-label="Edit run details"
              >
                <span>{document.floor || 'Unnamed floor'}</span>
                {document.seed && <b>· {document.seed}</b>}
              </button>
              <button
                type="button"
                className="mobile-overflow-button"
                onClick={() => setMobileSheet('menu')}
                aria-label="Open map menu"
                data-testid="mobile-menu-button"
              >
                ⋮
              </button>
            </>
          )}
        </header>
      </div>

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

      <main className={`workspace ${isMobile ? 'mobile-workspace' : ''}`}>
        {isMobile ? (
          <>
            <MapGrid
              onImport={openFilePicker}
              onExport={exportDocument}
              onNew={startNewDocument}
              onRoomActivate={() => setMobileSheet('inspector')}
              resetViewSignal={fitSignal}
            />

            {selectedRoom && mobileSheet === null && mapTool === 'move' && (
              <button
                type="button"
                className="mobile-room-peek"
                onClick={() => setMobileSheet('inspector')}
                data-testid="mobile-room-peek"
              >
                <span>Selected room</span>
                <strong>{selectedRoom.type.replaceAll('-', ' ')}</strong>
                <b>↑</b>
              </button>
            )}

            <MobileBottomBar
              mapTool={mapTool}
              sheet={mobileSheet}
              onTool={(tool) => {
                setMapTool(tool);
                setMobileSheet(null);
              }}
              onRooms={() => setMobileSheet('rooms')}
            />

            {mobileSheet === 'rooms' && (
              <MobileSheet title="Rooms" onClose={() => setMobileSheet(null)}>
                <RoomPalette onSelect={() => setMobileSheet(null)} />
              </MobileSheet>
            )}

            {mobileSheet === 'inspector' && selectedRoom && (
              <MobileSheet title="Room" onClose={() => setMobileSheet(null)}>
                <RoomInspector onDelete={() => setMobileSheet(null)} />
              </MobileSheet>
            )}

            {mobileSheet === 'run' && (
              <MobileSheet title="Run details" onClose={() => setMobileSheet(null)} compact>
                <div className="mobile-run-form">
                  <label>
                    <span>Run name</span>
                    <input value={document.name} onChange={(event) => setDocumentMeta({ name: event.target.value })} />
                  </label>
                  <label>
                    <span>Floor</span>
                    <input value={document.floor} onChange={(event) => setDocumentMeta({ floor: event.target.value })} />
                  </label>
                  <label>
                    <span>Seed</span>
                    <input value={document.seed} onChange={(event) => setDocumentMeta({ seed: event.target.value.toUpperCase() })} />
                  </label>
                </div>
              </MobileSheet>
            )}

            {mobileSheet === 'menu' && (
              <MobileSheet title="Map menu" onClose={() => setMobileSheet(null)} compact>
                <div className="mobile-menu-actions">
                  <button type="button" onClick={() => { setFitSignal((value) => value + 1); setMobileSheet(null); }}>Fit map</button>
                  <button type="button" onClick={() => { setShowIndices(!showIndices); setMobileSheet(null); }}>{showIndices ? 'Hide grid' : 'Show grid'}</button>
                  <button type="button" onClick={() => setMobileSheet('run')}>Edit run</button>
                  <button type="button" onClick={openFilePicker}>Import map</button>
                  <button type="button" onClick={() => { exportDocument(); setMobileSheet(null); }}>Export map</button>
                  <button type="button" className="danger-action" onClick={startNewDocument}>New map</button>
                </div>
              </MobileSheet>
            )}
          </>
        ) : (
          <>
            <RoomPalette />
            <MapGrid
              onImport={openFilePicker}
              onExport={exportDocument}
              onNew={startNewDocument}
            />
            <RoomInspector />
          </>
        )}
      </main>
    </div>
  );
}
