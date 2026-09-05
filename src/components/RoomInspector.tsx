import { useState } from 'react';
import { PICKUP_META, ROOM_TYPES, getRoomTypeMeta } from '../domain/catalog';
import { countUniqueAdjacencies, gridIndex } from '../domain/geometry';
import type { PickupKind, RoomShapeId, RoomTypeId } from '../domain/types';
import { useTrackerStore } from '../store/useTrackerStore';
import { PickupSprite, RoomTypeSprite } from './IsaacSprite';
import { RoomShapePicker } from './RoomShapePicker';

const QUICK_PICKUPS: PickupKind[] = ['coin', 'key', 'bomb', 'heart', 'chest', 'battery'];

export function RoomInspector() {
  const document = useTrackerStore((state) => state.document);
  const activeDimension = useTrackerStore((state) => state.activeDimension);
  const selectedRoomId = useTrackerStore((state) => state.selectedRoomId);
  const patchRoom = useTrackerStore((state) => state.patchRoom);
  const setRoomShape = useTrackerStore((state) => state.setRoomShape);
  const moveRoom = useTrackerStore((state) => state.moveRoom);
  const deleteRoom = useTrackerStore((state) => state.deleteRoom);
  const addPickup = useTrackerStore((state) => state.addPickup);
  const removePickup = useTrackerStore((state) => state.removePickup);

  const [pickupKind, setPickupKind] = useState<PickupKind>('collectible');
  const [pickupLabel, setPickupLabel] = useState('');
  const [pickupQuantity, setPickupQuantity] = useState(1);
  const [geometryError, setGeometryError] = useState('');

  const rooms = document.dimensions[activeDimension];
  const room = rooms.find((candidate) => candidate.id === selectedRoomId);

  if (!room) {
    return (
      <aside className="panel inspector-panel empty-inspector">
        <span className="eyebrow">Room inspector</span>
        <h2>No room selected</h2>
        <p>Select a room to change its type and shape, add notes, or record pickups you left behind.</p>
        <div className="inspector-empty-diagram">⌂ — · — ★</div>
      </aside>
    );
  }

  const meta = getRoomTypeMeta(room.type);
  const adjacencyCount = countUniqueAdjacencies(room, rooms);

  const nudge = (dx: number, dy: number) => {
    const moved = moveRoom(room.id, { x: room.anchor.x + dx, y: room.anchor.y + dy });
    setGeometryError(moved ? '' : 'Move blocked by the grid edge or another room.');
  };

  const handleShape = (shape: RoomShapeId) => {
    const changed = setRoomShape(room.id, shape);
    setGeometryError(changed ? '' : 'That shape would overlap another room or leave the grid.');
  };

  const submitPickup = () => {
    const label = pickupLabel.trim() || PICKUP_META[pickupKind].label;
    addPickup(room.id, { kind: pickupKind, label, quantity: Math.max(1, pickupQuantity) });
    setPickupLabel('');
    setPickupQuantity(1);
  };

  return (
    <aside className="panel inspector-panel" data-testid="room-inspector">
      <div className="panel-heading inspector-title">
        <div>
          <span className="eyebrow">Room inspector</span>
          <h2>
            <span className={`type-chip tone-${meta.tone}`}>
              <RoomTypeSprite type={room.type} fallback={meta.icon} scale={1} />
            </span>
            {meta.label}
          </h2>
        </div>
        <span className="grid-index-pill">#{gridIndex(room.anchor)}</span>
      </div>

      {meta.offGrid && (
        <div className="warning-card">
          This room is off-grid internally in Isaac. Its position here is a visual minimap placement.
        </div>
      )}

      <div className="field-grid">
        <label>
          <span>Type</span>
          <select
            value={room.type}
            onChange={(event) => patchRoom(room.id, { type: event.target.value as RoomTypeId })}
            data-testid="room-type-select"
          >
            {ROOM_TYPES.map((roomType) => <option key={roomType.id} value={roomType.id}>{roomType.label}</option>)}
          </select>
        </label>
      </div>

      <section className="inspector-section shape-inspector-section">
        <div className="section-title-row">
          <h3>Room shape</h3>
          <span>{room.shape}</span>
        </div>
        <RoomShapePicker value={room.shape} onChange={handleShape} />
      </section>

      <div className="room-facts">
        <span>Anchor ({room.anchor.x}, {room.anchor.y})</span>
        <span>{adjacencyCount} adjacent room{adjacencyCount === 1 ? '' : 's'}</span>
      </div>

      <div className="nudge-row" aria-label="Move room one grid cell">
        <span>Move</span>
        <button onClick={() => nudge(0, -1)} title="Move up">↑</button>
        <button onClick={() => nudge(-1, 0)} title="Move left">←</button>
        <button onClick={() => nudge(1, 0)} title="Move right">→</button>
        <button onClick={() => nudge(0, 1)} title="Move down">↓</button>
      </div>
      {geometryError && <div className="inline-error">{geometryError}</div>}

      <label className="checkbox-row">
        <input type="checkbox" checked={room.visited} onChange={(event) => patchRoom(room.id, { visited: event.target.checked })} />
        <span>Visited / revealed</span>
      </label>

      <section className="inspector-section">
        <div className="section-title-row">
          <h3>Pickups left here</h3>
          <span>{room.pickups.reduce((sum, pickup) => sum + pickup.quantity, 0)} total</span>
        </div>

        <div className="quick-pickups">
          {QUICK_PICKUPS.map((kind) => (
            <button
              type="button"
              key={kind}
              data-testid={`quick-pickup-${kind}`}
              onClick={() => addPickup(room.id, { kind, label: PICKUP_META[kind].label, quantity: 1 })}
              title={`Add ${PICKUP_META[kind].label}`}
            >
              <strong>
                <PickupSprite kind={kind} fallback={PICKUP_META[kind].icon} scale={1} />
              </strong>
              <span>+1</span>
            </button>
          ))}
        </div>

        <div className="pickup-form">
          <select value={pickupKind} onChange={(event) => setPickupKind(event.target.value as PickupKind)} aria-label="Pickup kind">
            {Object.entries(PICKUP_META).map(([kind, data]) => <option key={kind} value={kind}>{data.label}</option>)}
          </select>
          <input value={pickupLabel} onChange={(event) => setPickupLabel(event.target.value)} placeholder="Name / variant" aria-label="Pickup name" />
          <input type="number" min="1" max="99" value={pickupQuantity} onChange={(event) => setPickupQuantity(Number(event.target.value))} aria-label="Quantity" />
          <button type="button" className="primary-button" onClick={submitPickup}>Add</button>
        </div>

        <div className="pickup-list">
          {room.pickups.length === 0 && <p className="muted">Nothing recorded in this room yet.</p>}
          {room.pickups.map((pickup) => (
            <div className="pickup-row" key={pickup.id}>
              <span className="pickup-icon">
                <PickupSprite kind={pickup.kind} fallback={PICKUP_META[pickup.kind].icon} scale={1} />
              </span>
              <span className="pickup-name">{pickup.label}</span>
              <strong>×{pickup.quantity}</strong>
              <button type="button" className="icon-button danger" onClick={() => removePickup(room.id, pickup.id)} aria-label={`Remove ${pickup.label}`}>×</button>
            </div>
          ))}
        </div>
      </section>

      <label className="notes-field">
        <span>Notes</span>
        <textarea value={room.notes} onChange={(event) => patchRoom(room.id, { notes: event.target.value })} placeholder="Bombable wall, reroll pedestal, card on the floor…" rows={4} />
      </label>

      <button
        type="button"
        className="danger-button"
        onClick={() => {
          if (window.confirm('Delete this room and its recorded pickups?')) deleteRoom(room.id);
        }}
      >
        Delete room
      </button>
    </aside>
  );
}
