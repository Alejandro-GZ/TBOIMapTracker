import { ROOM_SHAPES, ROOM_TYPES } from '../domain/catalog';
import { useTrackerStore } from '../store/useTrackerStore';
import { RoomTypeSprite } from './IsaacSprite';

const GROUP_LABELS = {
  core: 'Core rooms',
  special: 'Special rooms',
  hidden: 'Hidden & off-grid',
};

export function RoomPalette() {
  const placementType = useTrackerStore((state) => state.placementType);
  const placementShape = useTrackerStore((state) => state.placementShape);
  const setPlacementType = useTrackerStore((state) => state.setPlacementType);
  const setPlacementShape = useTrackerStore((state) => state.setPlacementShape);

  return (
    <aside className="panel palette-panel">
      <div className="panel-heading">
        <div>
          <span className="eyebrow">Placement tool</span>
          <h2>Rooms</h2>
        </div>
      </div>

      {(['core', 'special', 'hidden'] as const).map((group) => (
        <section className="palette-group" key={group}>
          <h3>{GROUP_LABELS[group]}</h3>
          <div className="room-palette-grid">
            {ROOM_TYPES.filter((roomType) => roomType.group === group).map((roomType) => (
              <button
                type="button"
                key={roomType.id}
                className={`room-tool tone-${roomType.tone} ${placementType === roomType.id ? 'active' : ''}`}
                onClick={() => setPlacementType(roomType.id)}
                title={roomType.offGrid ? `${roomType.label} — off-grid internally in Isaac` : roomType.label}
              >
                <span className="room-tool-icon">
                  <RoomTypeSprite type={roomType.id} fallback={roomType.icon} scale={1.25} />
                </span>
                <span>{roomType.label}</span>
                {roomType.offGrid && <small>off-grid</small>}
              </button>
            ))}
          </div>
        </section>
      ))}

      <section className="shape-section">
        <label htmlFor="placement-shape">Room shape</label>
        <select
          id="placement-shape"
          value={placementShape}
          onChange={(event) => setPlacementShape(event.target.value as typeof placementShape)}
        >
          {ROOM_SHAPES.map((shape) => (
            <option key={shape.id} value={shape.id}>
              {shape.label} — {shape.footprint}
            </option>
          ))}
        </select>
      </section>

      <div className="tip-card">
        <strong>Fast tracking</strong>
        <span>Choose a type, then click an empty grid cell. Drag an existing room to move it.</span>
      </div>
    </aside>
  );
}
