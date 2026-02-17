/**
 * Screen <-> world coordinate conversion for the Universe drag system.
 * Matches the Konva layer transform at parallax = 1.0.
 */

/**
 * Convert screen (pixel) coordinates to world coordinates.
 * Inverse of: screenX = stageW/2 + (worldX - camera.x) * zoom
 */
export function screenToWorld(screenX, screenY, camera, zoom, stageSize) {
    return {
        x: camera.x + (screenX - stageSize.width / 2) / zoom,
        y: camera.y + (screenY - stageSize.height / 2) / zoom,
    };
}

/**
 * Convert world coordinates to screen (pixel) coordinates.
 * Forward transform: screenX = stageW/2 + (worldX - camera.x) * zoom
 */
export function worldToScreen(worldX, worldY, camera, zoom, stageSize) {
    return {
        x: stageSize.width / 2 + (worldX - camera.x) * zoom,
        y: stageSize.height / 2 + (worldY - camera.y) * zoom,
    };
}
