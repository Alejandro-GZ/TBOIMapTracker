import { useMemo, useState } from 'react';
import { ROOM_TYPES, getRoomTypeMeta } from '../domain/catalog';
import {
  TRACKABLE_MARKERS,
  TRACKABLE_MARKER_BY_ID,
  type MinimapIconId,
} from '../domain/minimapIcons';
import { getAllowedRoomShapes } from '../domain/roomRules';
import type { Pickup, RoomShapeId, RoomTypeId } from '../domain/types';
import { useTrackerStore } from '../store/useTrackerStore';
import { PickupSprite, RoomShapeSprite, RoomTypeSprite } from './IsaacSprite';
import { RoomShapePicker } from './RoomShapePicker';

const PICKUP_MARKERS = TRACKABLE_MARKERS.filter((marker) => marker.category === 'pickup');
const STRUCTURE_MARKERS = TRACKABLE_MARKERS.filter((marker) => marker.category === 'structure');

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" shapeRendering="crispEdges">
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 10v6M14 10v6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}

interface PickupGroup {
  key: string;
  representative: Pickup;
  quantity: number;
}

function groupRoomContents(pickups: Pickup[]): PickupGroup[] {
  const grouped = new Map<string, PickupGroup>();
  for (const pickup of pickups) {
    const key = `${pickup.iconId ?? pickup.kind}:${pickup.label}`;
    const current = grouped.get(key);
    if (current) {
      current.quantity += pickup.quantity;
    } else {
      grouped.set(key, { key, representative: pickup, quantity: pickup.quantity });
    }
  }
  return [...grouped.values()];
}

export function RoomInspector() {
  const document = useTrackerStore((state) => state.document);
  const activeDimension = useTrackerStore((state) => state.activeDimension);
  const selectedRoomId = useTrackerStore((state) => state.selectedRoomId);
  const patchRoom = useTrackerStore((state) => state.patchRoom);
  const setRoomType = useTrackerStore((state) => state.setRoomType);
  const setRoomShape = useTrackerStore((state) => state.setRoomShape);
  const deleteRoom = useTrackerStore((state) => state.deleteRoom);
  const addPickup = useTrackerStore((state) => state.addPickup);
  const decrementPickup = useTrackerStore((state) => state.decrementPickup);

  const [geometryError, setGeometryError] = useState('');
  const [shapeOpen, setShapeOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);
  const [contentTab, setContentTab] = useState<'pickup' | 'structure'>('pickup');

  const rooms = document.dimensions[activeDimension];
  const room = rooms.find((candidate) => candidate.id === selectedRoomId);
  const groupedContents = useMemo(() => groupRoomContents(room?.pickups ?? []), [room?.pickups]);

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

  const handleType = (type: RoomTypeId) => {
    const changed = setRoomType(room.id, type);
    setGeometryError(changed ? '' : 'That room type does not fit here.');
    if (changed) setShapeOpen(false);
  };

  const handleShape = (shape: RoomShapeId) => {
    const changed = setRoomShape(room.id, shape);
    setGeometryError(changed ? '' : 'That shape does not fit here.');
    if (changed) setShapeOpen(false);
  };

  const addExactMarker = (id: MinimapIconId) => {
    const marker = TRACKABLE_MARKER_BY_ID[id];
    if (!marker) return;
    addPickup(room.id, {
      kind: marker.kind,
      iconId: marker.id,
      label: marker.label,
      quantity: 1,
    });
  };

  const markerOptions = contentTab === 'pickup' ? PICKUP_MARKERS : STRUCTURE_MARKERS;

  return (
    <aside className="panel inspector-panel" data-testid="room-inspector">
      <div className="room-inspector-toolbar">
        <span className={`type-chip tone-${meta.tone}`}>
          <RoomTypeSprite type={room.type} fallback={meta.icon} fitSize={24} />
        </span>

        <select
          className="inspector-type-select"
          value={room.type}
          onChange={(event) => handleType(event.target.value as RoomTypeId)}
          data-testid="room-type-select"
          aria-label="Room type"
        >
          {ROOM_TYPES.map((roomType) => <option key={roomType.id} value={roomType.id}>{roomType.label}</option>)}
        </select>

        <button
          type="button"
          className="inspector-shape-button"
          data-testid="room-shape-button"
          onClick={() => setShapeOpen((open) => !open)}
          aria-expanded={shapeOpen}
          title="Change room shape"
          disabled={allowedShapes.length <= 1}
        >
          <span className="inspector-shape-thumb"><RoomShapeSprite shape={room.shape} /></span>
          <span aria-hidden="true">▾</span>
        </button>

        <button
          type="button"
          className="inspector-delete-button"
          aria-label="Delete room"
          title="Delete room"
          onClick={() => deleteRoom(room.id)}
        >
          <TrashIcon />
        </button>
      </div>

      {shapeOpen && (
        <div className="inspector-popover shape-popover" data-testid="shape-popover">
          <div className="popover-heading">
            <strong>Room shape</strong>
            <button type="button" onClick={() => setShapeOpen(false)} aria-label="Close shape picker">×</button>
          </div>
          <RoomShapePicker value={room.shape} onChange={handleShape} allowedShapes={allowedShapes} />
        </div>
      )}

      {geometryError && <div className="inline-error">{geometryError}</div>}

      <label className="checkbox-row mark-row">
        <input
          type="checkbox"
          checked={room.marked ?? false}
          onChange={(event) => patchRoom(room.id, { marked: event.target.checked })}
          data-testid="room-mark-checkbox"
        />
        <span>Mark</span>
      </label>

      <section className="inspector-section compact-contents-section">
        <div className="section-title-row">
          <h3>Contents</h3>
          <span>{room.pickups.reduce((sum, pickup) => sum + pickup.quantity, 0)} total</span>
        </div>

        <div className="content-token-list" data-testid="content-token-list">
          {groupedContents.map((group) => (
            <button
              type="button"
              className="content-token"
              key={group.key}
              title={`${group.representative.label}${group.quantity > 1 ? ` ×${group.quantity}` : ''} — click to remove one`}
              aria-label={`Remove one ${group.representative.label}`}
              onClick={() => decrementPickup(room.id, group.representative.id)}
            >
              <PickupSprite
                kind={group.representative.kind}
                iconId={group.representative.iconId}
                fallback="•"
                fitSize={28}
              />
              {group.quantity > 1 && <b>×{group.quantity}</b>}
            </button>
          ))}
          <button
            type="button"
            className="content-add-button"
            data-testid="add-content-button"
            onClick={() => setContentOpen(true)}
            aria-label="Add pickup or structure"
            title="Add pickup or structure"
          >
            +
          </button>
        </div>
      </section>

      <label className="notes-field compact-notes-field">
        <span>Notes</span>
        <textarea value={room.notes} onChange={(event) => patchRoom(room.id, { notes: event.target.value })} placeholder="Bombable wall, reroll pedestal, card on the floor…" rows={4} />
      </label>

      {contentOpen && (
        <div className="inspector-modal-backdrop" data-testid="content-picker-modal" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setContentOpen(false);
        }}>
          <div className="content-picker-modal" role="dialog" aria-modal="true" aria-label="Add room contents">
            <div className="popover-heading">
              <strong>Add contents</strong>
              <button type="button" onClick={() => setContentOpen(false)} aria-label="Close contents picker">×</button>
            </div>
            <div className="content-picker-tabs">
              <button type="button" className={contentTab === 'pickup' ? 'active' : ''} onClick={() => setContentTab('pickup')}>Pickups</button>
              <button type="button" className={contentTab === 'structure' ? 'active' : ''} onClick={() => setContentTab('structure')}>Structs</button>
            </div>
            <div className="content-picker-grid">
              {markerOptions.map((marker) => (
                <button
                  type="button"
                  key={marker.id}
                  className="content-picker-option"
                  data-testid={`marker-option-${marker.id}`}
                  title={`Add ${marker.label}`}
                  aria-label={`Add ${marker.label}`}
                  onClick={() => addExactMarker(marker.id)}
                >
                  <PickupSprite kind={marker.kind} iconId={marker.id} fitSize={30} />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
