import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { canPlaceRoom } from '../domain/geometry';
import type {
  DimensionId,
  GridPoint,
  Pickup,
  Room,
  RoomShapeId,
  RoomTypeId,
  TrackerDocument,
} from '../domain/types';

const id = () => crypto.randomUUID();
const now = () => new Date().toISOString();

const createDocument = (): TrackerDocument => {
  const timestamp = now();
  return {
    version: 1,
    id: id(),
    name: 'New run',
    floor: 'Basement I',
    seed: '',
    createdAt: timestamp,
    updatedAt: timestamp,
    dimensions: {
      main: [
        {
          id: id(),
          anchor: { x: 6, y: 6 },
          shape: '1x1',
          type: 'start',
          visited: true,
          notes: '',
          pickups: [],
        },
      ],
      secondary: [],
      'death-certificate': [],
    },
  };
};

interface TrackerState {
  document: TrackerDocument;
  activeDimension: DimensionId;
  selectedRoomId: string | null;
  placementType: RoomTypeId;
  placementShape: RoomShapeId;
  showIndices: boolean;
  setActiveDimension: (dimension: DimensionId) => void;
  setPlacementType: (type: RoomTypeId) => void;
  setPlacementShape: (shape: RoomShapeId) => void;
  setShowIndices: (show: boolean) => void;
  selectRoom: (roomId: string | null) => void;
  addRoom: (anchor: GridPoint) => boolean;
  moveRoom: (roomId: string, anchor: GridPoint) => boolean;
  setRoomShape: (roomId: string, shape: RoomShapeId) => boolean;
  patchRoom: (roomId: string, patch: Partial<Pick<Room, 'type' | 'visited' | 'notes'>>) => void;
  deleteRoom: (roomId: string) => void;
  addPickup: (roomId: string, pickup: Omit<Pickup, 'id'>) => void;
  removePickup: (roomId: string, pickupId: string) => void;
  setDocumentMeta: (patch: Partial<Pick<TrackerDocument, 'name' | 'floor' | 'seed'>>) => void;
  loadDocument: (document: TrackerDocument) => void;
  newDocument: () => void;
}

const withTouchedDocument = (document: TrackerDocument): TrackerDocument => ({
  ...document,
  updatedAt: now(),
});

export const useTrackerStore = create<TrackerState>()(
  persist(
    (set, get) => ({
      document: createDocument(),
      activeDimension: 'main',
      selectedRoomId: null,
      placementType: 'normal',
      placementShape: '1x1',
      showIndices: false,

      setActiveDimension: (activeDimension) => set({ activeDimension, selectedRoomId: null }),
      setPlacementType: (placementType) => set({ placementType }),
      setPlacementShape: (placementShape) => set({ placementShape }),
      setShowIndices: (showIndices) => set({ showIndices }),
      selectRoom: (selectedRoomId) => set({ selectedRoomId }),

      addRoom: (anchor) => {
        const state = get();
        const rooms = state.document.dimensions[state.activeDimension];
        const room: Room = {
          id: id(),
          anchor,
          shape: state.placementShape,
          type: state.placementType,
          visited: false,
          notes: '',
          pickups: [],
        };
        if (!canPlaceRoom(rooms, room)) return false;

        set({
          document: withTouchedDocument({
            ...state.document,
            dimensions: {
              ...state.document.dimensions,
              [state.activeDimension]: [...rooms, room],
            },
          }),
          selectedRoomId: room.id,
        });
        return true;
      },

      moveRoom: (roomId, anchor) => {
        const state = get();
        const rooms = state.document.dimensions[state.activeDimension];
        const current = rooms.find((room) => room.id === roomId);
        if (!current) return false;
        const moved = { ...current, anchor };
        if (!canPlaceRoom(rooms, moved, roomId)) return false;

        set({
          document: withTouchedDocument({
            ...state.document,
            dimensions: {
              ...state.document.dimensions,
              [state.activeDimension]: rooms.map((room) => (room.id === roomId ? moved : room)),
            },
          }),
        });
        return true;
      },

      setRoomShape: (roomId, shape) => {
        const state = get();
        const rooms = state.document.dimensions[state.activeDimension];
        const current = rooms.find((room) => room.id === roomId);
        if (!current) return false;
        const resized = { ...current, shape };
        if (!canPlaceRoom(rooms, resized, roomId)) return false;

        set({
          document: withTouchedDocument({
            ...state.document,
            dimensions: {
              ...state.document.dimensions,
              [state.activeDimension]: rooms.map((room) => (room.id === roomId ? resized : room)),
            },
          }),
        });
        return true;
      },

      patchRoom: (roomId, patch) => {
        const state = get();
        const rooms = state.document.dimensions[state.activeDimension];
        set({
          document: withTouchedDocument({
            ...state.document,
            dimensions: {
              ...state.document.dimensions,
              [state.activeDimension]: rooms.map((room) =>
                room.id === roomId ? { ...room, ...patch } : room,
              ),
            },
          }),
        });
      },

      deleteRoom: (roomId) => {
        const state = get();
        const rooms = state.document.dimensions[state.activeDimension];
        set({
          document: withTouchedDocument({
            ...state.document,
            dimensions: {
              ...state.document.dimensions,
              [state.activeDimension]: rooms.filter((room) => room.id !== roomId),
            },
          }),
          selectedRoomId: state.selectedRoomId === roomId ? null : state.selectedRoomId,
        });
      },

      addPickup: (roomId, pickup) => {
        const state = get();
        const rooms = state.document.dimensions[state.activeDimension];
        set({
          document: withTouchedDocument({
            ...state.document,
            dimensions: {
              ...state.document.dimensions,
              [state.activeDimension]: rooms.map((room) =>
                room.id === roomId
                  ? { ...room, pickups: [...room.pickups, { ...pickup, id: id() }] }
                  : room,
              ),
            },
          }),
        });
      },

      removePickup: (roomId, pickupId) => {
        const state = get();
        const rooms = state.document.dimensions[state.activeDimension];
        set({
          document: withTouchedDocument({
            ...state.document,
            dimensions: {
              ...state.document.dimensions,
              [state.activeDimension]: rooms.map((room) =>
                room.id === roomId
                  ? { ...room, pickups: room.pickups.filter((pickup) => pickup.id !== pickupId) }
                  : room,
              ),
            },
          }),
        });
      },

      setDocumentMeta: (patch) => {
        const state = get();
        set({ document: withTouchedDocument({ ...state.document, ...patch }) });
      },

      loadDocument: (document) =>
        set({ document, activeDimension: 'main', selectedRoomId: null }),

      newDocument: () =>
        set({ document: createDocument(), activeDimension: 'main', selectedRoomId: null }),
    }),
    { name: 'tboi-map-tracker-v1' },
  ),
);
