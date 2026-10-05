import {
  closestCorners,
  pointerWithin,
  rectIntersection,
  type CollisionDetection,
} from '@dnd-kit/core';

/**
 * Sensor-aware collision detection.
 *
 * `pointerWithin` is the right default for pointer drags — it is precise and it
 * never reports a collision while the pointer is still inside the origin cell.
 * But it depends entirely on `pointerCoordinates`, which the KeyboardSensor does
 * not provide, so it returns `[]` for every keyboard drag and `over` stays
 * undefined. Keyboard drags therefore silently no-op.
 *
 * For keyboard drags we fall back to rectangle intersection against the
 * translated active rect, which naturally prefers the innermost/highest-overlap
 * target (a task card over its cell, a column over the board). If the active
 * rect overlaps nothing at all — common after arrowing past the last container —
 * `closestCorners` still resolves the nearest one so a drop lands somewhere sane
 * rather than nowhere.
 */
export const boardCollisionDetection: CollisionDetection = (args) => {
  if (args.pointerCoordinates) {
    return pointerWithin(args);
  }

  const intersections = rectIntersection(args);

  return intersections.length > 0 ? intersections : closestCorners(args);
};
