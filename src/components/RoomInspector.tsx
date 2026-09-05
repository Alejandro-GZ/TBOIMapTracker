import { useState } from 'react';
import { ROOM_TYPES, getRoomTypeMeta } from '../domain/catalog';
import {
  DEFAULT_PICKUP_ICON_BY_KIND,
  TRACKABLE_MARKERS,
  TRACKABLE_MARKER_BY_ID,
  type MinimapIconId,
} from '../domain/minimapIcons';
import { getAllowedRoomShapes } from '../domain/roomRules';
import type { RoomShapeId, RoomTypeId } from '../domain/types';
import { useTrackerStore } from '../store/useTrackerStore';
import { PickupSprite, RoomTypeSprite } from './IsaacSprite';
import { RoomShapePicker } from './RoomShapePicker';

const QUICK_MARKERS: MinimapIconId[] = [
  'P_PENNY',
  'P_KEY',
  'P_BOMB',
  'P_FULLHEART',
  'P_CHEST',
  'P_BATTERY',
];

const PICKUP_MARKERS = TRACKABLE_MARKERS.filter((marker) => marker.category === 'pickup');
const STRUCTURE_MARKERS = TRACKABLE_MARKERS.filter((marker) => marker.category === 'structure');

export function RoomInspector() {
  const document = useTrackerStore((state) => state.document);
  const activeDimension = useTrackerStore((state) => state.activeDimension);
  const selectedRoomId = useTrackerStore((state) => state.selectedRoomId);
  const patchRoom = useTrackerStore((state) => state.patchRoom);
  const setRoomType = useTrackerStore((state) => state.setRoomType);
  const setRoomShape = useTrackerStore((state) => state.setRoomShape);
  const moveRoom = useTrackerStore((state) => state.moveRoom);
  const deleteRoom = useTrackerStore((state) => state.deleteRoom);
  const addPickup = useTrackerStore((state) => state.addPickup);
  const removePickup = useTrackerStore((state) => state.removePickup);

  const [markerId, setMarkerId] = useState<MinimapIconId>('P_ITEM');
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
        <div className="inspector-empty-diagram">⌂ — · — ★</div>
      </aside>
    );
  }

  const meta = getRoomTypeMeta(room.type);
  const allowedShapes = getAllowedRoomShapes(room.type);
  const currentShapeIsValid = allowedShapes.includes(room.shape);
  const showShapePicker = allowedShapes.length > 1 || !currentShapeIsValid;

  const nudge = (dx: number, dy: number) => {
    const moved = moveRoom(room.id, { x: room.anchor.x + dx, y: room.anchor.y + dy });
    setGeometryError(moved ? '' : 'Move blocked.');
  };

  const handleType = (type: RoomTypeId) => {
    const changed = setRoomType(room.id, type);
    setGeometryError(changed ? '' : 'The required room shape does not fit here.');
  };

  const handleShape = (shape: RoomShapeId) => {
    const changed = setRoomShape(room.id, shape);
    setGeometryError(changed ? '' : 'That shape does not fit here.');
  };

  const addExactMarker = (id: MinimapIconId, quantity = 1, labelOverride?: string) => {
    const marker = TRACKABLE_MARKER_BY_ID[id];
    if (!marker) return;
    addPickup(room.id, {
      kind: marker.kind,
      iconId: marker.id,
      label: labelOverride?.trim() || marker.label,
      quantity: Math.max(1, quantity),
    });
  };

  const submitPickup = () => {
    addExactMarker(markerId, pickupQuantity, pickupLabel);
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
              <RoomTypeSprite type={room.type} fallback={meta.icon} scale={2} />
            </span>
            {meta.label}
          </h2>
        </div>
      </div>

      <div className="field-grid">
        <label>
          <span>Type</span>
          <select
            value={room.type}
            onChange={(event) => handleType(event.target.value as RoomTypeId)}
            data-testid="room-type-select"
          >
            {ROOM_TYPES.map((roomType) => <option key={roomType.id} value={roomType.id}>{roomType.label}</option>)}
          </select>
        </label>
      </div>

      {showShapePicker && (
        <section className="inspector-section shape-inspector-section">
          <div className="section-title-row">
            <h3>Room shape</h3>
          </div>
          <RoomShapePicker value={room.shape} onChange={handleShape} allowedShapes={allowedShapes} />
        </section>
      )}

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
          <h3>Contents left here</h3>
          <span>{room.pickups.reduce((sum, pickup) => sum + pickup.quantity, 0)} total</span>
        </div>

        <div className="quick-pickups">
          {QUICK_MARKERS.map((id) => {
            const marker = TRACKABLE_MARKER_BY_ID[id]!;
            return (
              <button
                type="button"
                key={id}
                data-testid={`quick-pickup-${marker.kind}`}
                onClick={() => addExactMarker(id)}
                title={`Add ${marker.label}`}
              >
                <strong>
                  <PickupSprite kind={marker.kind} iconId={id} scale={2} />
                </strong>
                <span>+1</span>
              </button>
            );
          })}
        </div>

        <div className="pickup-form exact-marker-form">
          <select
            value={markerId}
            onChange={(event) => setMarkerId(event.target.value as MinimapIconId)}
            aria-label="Pickup or structure"
            data-testid="marker-select"
          >
            <optgroup label="Pickups">
              {PICKUP_MARKERS.map((marker) => <option key={marker.id} value={marker.id}>{marker.label}</option>)}
            </optgroup>
            <optgroup label="Structures">
              {STRUCTURE_MARKERS.map((marker) => <option key={marker.id} value={marker.id}>{marker.label}</option>)}
            </optgroup>
          </select>
          <input value={pickupLabel} onChange={(event) => setPickupLabel(event.target.value)} placeholder="Custom label" aria-label="Marker name" />
          <input type="number" min="1" max="99" value={pickupQuantity} onChange={(event) => setPickupQuantity(Number(event.target.value))} aria-label="Quantity" />
          <button type="button" className="primary-button" onClick={submitPickup}>Add</button>
        </div>

        <div className="pickup-list">
          {room.pickups.length === 0 && <p className="muted">Nothing recorded in this room yet.</p>}
          {room.pickups.map((pickup) => (
            <div className="pickup-row" key={pickup.id}>
              <span className="pickup-icon">
                <PickupSprite
                  kind={pickup.kind}
                  iconId={pickup.iconId}
                  fallback={DEFAULT_PICKUP_ICON_BY_KIND[pickup.kind] ? undefined : '•'}
                  scale={2}
                />
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
          if (window.confirm('Delete this room and its recorded contents?')) deleteRoom(room.id);
        }}
      >
        Delete room
      </button>
    </aside>
  );
}
