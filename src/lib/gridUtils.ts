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
          "empty empty empty"
        `,
        gridTemplateColumns: '1fr 1fr 1fr',
        gridTemplateRows: '1fr 1fr 1fr',
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
    case 7:
      return {
        gridTemplateAreas: `
          "primary primary secondary1"
          "primary primary secondary2"
          "secondary3 secondary4 secondary5"
          "secondary6 secondary7 secondary8"
        `,
        gridTemplateColumns: '1fr 1fr 1fr',
        gridTemplateRows: '1fr 1fr 1fr 1fr',
      };
    case 8:
      return {
        gridTemplateAreas: `
          "primary primary secondary1"
          "primary primary secondary2"
          "secondary3 secondary4 secondary5"
          "secondary6 secondary7 secondary8"
        `,
        gridTemplateColumns: '1fr 1fr 1fr',
        gridTemplateRows: '1fr 1fr 1fr 1fr',
      };
    case 9:
      return {
        gridTemplateAreas: `
          "secondary1 secondary2 secondary3"
          "secondary4 primary secondary5"
          "secondary6 secondary7 secondary8"
        `,
        gridTemplateColumns: '1fr 1fr 1fr',
        gridTemplateRows: '1fr 1fr 1fr',
      };
    default:
      // For more than 9 streams, use the same layout as 9 streams
      // This should never happen as we limit to 9 streams max for premium
      return {
        gridTemplateAreas: `
          "secondary1 secondary2 secondary3"
          "secondary4 primary secondary5"
          "secondary6 secondary7 secondary8"
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
  // to fill the grid based on the stream count (maximum 9 streams for premium)
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
    case 7:
      return 1; // Need 8 spots for a 3x4 grid
    case 8:
      return 0; // Grid is filled
    case 9:
      return 0; // No placeholders needed when we have 9 streams
    default:
      // For more than 9 streams, we don't need placeholders
      // This should never happen as we limit to 9 streams max for premium
      return 0;
  }
}

/**
 * Layout types for premium custom layouts
 */
export enum LayoutType {
  DEFAULT = 'default',
  GRID_EQUAL = 'grid_equal',
  SPOTLIGHT = 'spotlight',
  SIDEBAR = 'sidebar',
  CUSTOM = 'custom'
}

/**
 * Custom layout configuration for premium users
 */
export interface CustomLayoutConfig {
  type: LayoutType;
  pinnedStreams?: string[]; // Stream IDs that should be pinned
  customPositions?: { [streamId: string]: { gridArea: string } };
  name?: string;
  id?: string;
}

/**
 * Get grid template styles for custom layouts
 */
export function getCustomGridTemplateStyles(
  streamCount: number,
  layoutType: LayoutType = LayoutType.DEFAULT,
  customConfig?: CustomLayoutConfig
): {
  gridTemplateAreas: string;
  gridTemplateColumns: string;
  gridTemplateRows: string;
} {
  switch (layoutType) {
    case LayoutType.GRID_EQUAL:
      return getEqualGridLayout(streamCount);
    case LayoutType.SPOTLIGHT:
      return getSpotlightLayout(streamCount);
    case LayoutType.SIDEBAR:
      return getSidebarLayout(streamCount);
    case LayoutType.CUSTOM:
      return customConfig ? getCustomLayout(streamCount, customConfig) : getGridTemplateStyles(streamCount);
    default:
      return getGridTemplateStyles(streamCount);
  }
}

/**
 * Equal grid layout - all streams same size
 */
function getEqualGridLayout(streamCount: number) {
  if (streamCount <= 1) {
    return {
      gridTemplateAreas: '"stream1"',
      gridTemplateColumns: '1fr',
      gridTemplateRows: '1fr',
    };
  }
  
  if (streamCount <= 4) {
    const areas = Array.from({ length: streamCount }, (_, i) => `stream${i + 1}`);
    return {
      gridTemplateAreas: streamCount === 2 
        ? `"${areas[0]} ${areas[1]}"` 
        : `"${areas[0]} ${areas[1]}" "${areas[2] || 'empty'} ${areas[3] || 'empty'}"`,
      gridTemplateColumns: '1fr 1fr',
      gridTemplateRows: streamCount <= 2 ? '1fr' : '1fr 1fr',
    };
  }
  
  // For 5-9 streams, use 3x3 grid
  const areas = Array.from({ length: 9 }, (_, i) => 
    i < streamCount ? `stream${i + 1}` : 'empty'
  );
  
  return {
    gridTemplateAreas: `
      "${areas[0]} ${areas[1]} ${areas[2]}"
      "${areas[3]} ${areas[4]} ${areas[5]}"
      "${areas[6]} ${areas[7]} ${areas[8]}"
    `,
    gridTemplateColumns: '1fr 1fr 1fr',
    gridTemplateRows: '1fr 1fr 1fr',
  };
}

/**
 * Spotlight layout - one large stream, others small
 */
function getSpotlightLayout(streamCount: number) {
  if (streamCount <= 1) {
    return {
      gridTemplateAreas: '"spotlight"',
      gridTemplateColumns: '1fr',
      gridTemplateRows: '1fr',
    };
  }
  
  const secondaryAreas = Array.from({ length: Math.min(streamCount - 1, 8) }, (_, i) => `secondary${i + 1}`);
  
  return {
    gridTemplateAreas: `
      "spotlight spotlight ${secondaryAreas[0] || 'empty'}"
      "spotlight spotlight ${secondaryAreas[1] || 'empty'}"
      "${secondaryAreas[2] || 'empty'} ${secondaryAreas[3] || 'empty'} ${secondaryAreas[4] || 'empty'}"
    `,
    gridTemplateColumns: '2fr 2fr 1fr',
    gridTemplateRows: '1fr 1fr 1fr',
  };
}

/**
 * Sidebar layout - main content with sidebar of streams
 */
function getSidebarLayout(streamCount: number) {
  if (streamCount <= 1) {
    return {
      gridTemplateAreas: '"main"',
      gridTemplateColumns: '1fr',
      gridTemplateRows: '1fr',
    };
  }
  
  const sidebarAreas = Array.from({ length: Math.min(streamCount - 1, 4) }, (_, i) => `sidebar${i + 1}`);
  
  return {
    gridTemplateAreas: `
      "main ${sidebarAreas[0] || 'empty'}"
      "main ${sidebarAreas[1] || 'empty'}"
      "main ${sidebarAreas[2] || 'empty'}"
      "main ${sidebarAreas[3] || 'empty'}"
    `,
    gridTemplateColumns: '3fr 1fr',
    gridTemplateRows: '1fr 1fr 1fr 1fr',
  };
}

/**
 * Custom layout based on user configuration
 */
function getCustomLayout(streamCount: number, config: CustomLayoutConfig) {
  // For now, fall back to default layout
  // This would be expanded to support fully custom positioning
  return getGridTemplateStyles(streamCount);
}