/**
 * Grid layout utilities for the multi-stream viewer
 * Implements a primary stream layout with secondary streams
 */

/**
 * Returns the appropriate grid template CSS for the given number of streams
 * Implements a layout with a primary stream and secondary streams arranged around it
 * For 3+ streams, the primary stream is in the top-left corner
 */
export function getGridTemplateStyles(streamCount: number): {
  gridTemplateAreas: string;
  gridTemplateColumns: string;
  gridTemplateRows: string;
} {
  switch (streamCount) {
    case 0:
      return {
        gridTemplateAreas: '"empty"',
        gridTemplateColumns: '1fr',
        gridTemplateRows: '1fr',
      };
    case 1:
      return {
        gridTemplateAreas: '"primary"',
        gridTemplateColumns: '1fr',
        gridTemplateRows: '1fr',
      };
    case 2:
      return {
        gridTemplateAreas: '"primary secondary1"',
        gridTemplateColumns: '1fr 1fr',
        gridTemplateRows: '1fr',
      };
    case 3:
      return {
        gridTemplateAreas: `
          "primary primary secondary1"
          "primary primary secondary2"
        `,
        gridTemplateColumns: '3fr 3fr 2fr',
        gridTemplateRows: '1fr 1fr',
      };
    case 4:
      return {
        gridTemplateAreas: `
          "primary primary secondary1"
          "primary primary secondary2"
          "secondary3 secondary4 secondary5"
        `,
        gridTemplateColumns: '1fr 1fr 1fr',
        gridTemplateRows: '1fr 1fr 1fr',
      };
    case 5:
      return {
        gridTemplateAreas: `
          "primary primary secondary1"
          "primary primary secondary2"
          "secondary3 secondary4 secondary5"
        `,
        gridTemplateColumns: '1fr 1fr 1fr',
        gridTemplateRows: '1fr 1fr 1fr',
      };
    case 6:
      return {
        gridTemplateAreas: `
          "primary primary secondary1"
          "primary primary secondary2"
          "secondary3 secondary4 secondary5"
        `,
        gridTemplateColumns: '1fr 1fr 1fr',
        gridTemplateRows: '1fr 1fr 1fr',
      };
    default:
      // For more than 6 streams, use the same layout as 6 streams
      // This should never happen as we limit to 6 streams max
      return {
        gridTemplateAreas: `
          "primary primary secondary1"
          "primary primary secondary2"
          "secondary3 secondary4 secondary5"
        `,
        gridTemplateColumns: '1fr 1fr 1fr',
        gridTemplateRows: '1fr 1fr 1fr',
      };
  }
}

/**
 * Returns the grid area name for a stream based on its index and primary status
 */
export function getGridArea(index: number, isPrimary: boolean, totalStreams: number): string {
  // If this is the primary stream, return the primary grid area
  if (isPrimary) {
    return 'primary';
  }
  
  // For 2 streams, use a simpler approach to ensure both are displayed
  if (totalStreams === 2) {
    return 'secondary1';
  }
  
  // For secondary streams, we need to assign them to secondary1, secondary2, etc.
  // We need to keep track of which secondary positions are already assigned
  
  // Find the first available secondary position based on the index
  // For simplicity, we'll just use the 1-based index for secondary streams
  return `secondary${index}`;
}

/**
 * Returns the number of placeholder spots needed to fill the grid
 */
export function getPlaceholderCount(streamCount: number): number {
  // For our layout, we need to calculate how many spots are needed
  // to fill the grid based on the stream count (maximum 6 streams)
  switch (streamCount) {
    case 0:
      return 1; // Empty state
    case 1:
      return 0; // Just the primary stream, no placeholders
    case 2:
      return 0; // Side by side, no placeholders needed
    case 3:
      return 0; // No placeholders needed for the 2x2 grid with primary spanning 2x2
    case 4:
      return 1; // Need 5 spots for a 3x3 grid with primary spanning 2x2
    case 5:
      return 0; // Grid is filled
    case 6:
      return 0; // No placeholders needed when we have 6 streams
    default:
      // For more than 6 streams, we don't need placeholders
      // This should never happen as we limit to 6 streams max
      return 0;
  }
}