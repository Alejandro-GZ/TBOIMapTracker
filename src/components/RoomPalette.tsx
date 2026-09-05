import { ROOM_TYPES } from '../domain/catalog';
import { useTrackerStore } from '../store/useTrackerStore';
import { RoomTypeSprite } from './IsaacSprite';

const GROUP_LABELS = {
  core: 'Core rooms',
  special: 'Special rooms',
  hidden: 'Hidden & off-grid',
};

export function RoomPalette() {
  const placementType = useTrackerStore((state) => state.placementType);
  const setPlacementType = useTrackerStore((state) => state.setPlacementType);

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
                  <RoomTypeSprite type={roomType.id} fallback={roomType.icon} scale={1} />
                </span>
                <span>{roomType.label}</span>
                {roomType.offGrid && <small>off-grid</small>}
              </button>
            ))}
          </div>
        </section>
      ))}

      <div className="tip-card room-drag-help">
        <strong>Draw the footprint</strong>
        <span>Click one cell for 1×1. Drag across two cells for 1×2 / 2×1, or across a 2×2 block for a large room.</span>
        <span>Corridor and L variants can still be selected from the room inspector after placement.</span>
      </div>
    </aside>
  );
}
