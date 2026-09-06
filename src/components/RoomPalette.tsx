import { ROOM_TYPES } from '../domain/catalog';
import { useTrackerStore } from '../store/useTrackerStore';
import { RoomTypeSprite } from './IsaacSprite';

const GROUP_LABELS = {
  core: 'Core',
  special: 'Special',
  hidden: 'Hidden',
};

interface RoomPaletteProps {
  onSelect?: () => void;
}

export function RoomPalette({ onSelect }: RoomPaletteProps = {}) {
  const placementType = useTrackerStore((state) => state.placementType);
  const setPlacementType = useTrackerStore((state) => state.setPlacementType);

  return (
    <aside className="panel palette-panel">
      <div className="panel-heading palette-title">
        <h2>Rooms</h2>
      </div>

      {(['core', 'special', 'hidden'] as const).map((group) => (
        <section className={`palette-group palette-group-${group}`} key={group}>
          <h3>{GROUP_LABELS[group]}</h3>
          <div className="room-palette-grid">
            {ROOM_TYPES.filter((roomType) => roomType.group === group).map((roomType) => (
              <button
                type="button"
                key={roomType.id}
                data-testid={`room-tool-${roomType.id}`}
                className={`room-tool tone-${roomType.tone} ${placementType === roomType.id ? 'active' : ''}`}
                onClick={() => {
                  setPlacementType(roomType.id);
                  onSelect?.();
                }}
                title={roomType.offGrid ? `${roomType.label} — off-grid internally in Isaac` : roomType.label}
              >
                <span className="room-tool-icon">
                  <RoomTypeSprite type={roomType.id} fallback={roomType.icon} fitSize={24} />
                </span>
                <span>{roomType.label}</span>
              </button>
            ))}
          </div>
        </section>
      ))}
    </aside>
  );
}
