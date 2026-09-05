import { ROOM_SHAPES } from '../domain/catalog';
import type { RoomShapeId } from '../domain/types';
import { RoomShapeSprite } from './IsaacSprite';

export function RoomShapePicker({
  value,
  onChange,
}: {
  value: RoomShapeId;
  onChange: (shape: RoomShapeId) => void;
}) {
  return (
    <div className="room-shape-picker" role="group" aria-label="Room shape">
      {ROOM_SHAPES.map((shape) => (
        <button
          type="button"
          key={shape.id}
          className={`room-shape-option ${value === shape.id ? 'active' : ''}`}
          onClick={() => onChange(shape.id)}
          title={`${shape.label} — ${shape.footprint}`}
          data-testid={`shape-option-${shape.id}`}
          aria-pressed={value === shape.id}
        >
          <span className="room-shape-thumb">
            <RoomShapeSprite shape={shape.id} />
          </span>
          <span>{shape.label}</span>
        </button>
      ))}
    </div>
  );
}
