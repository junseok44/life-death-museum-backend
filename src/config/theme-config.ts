/**
 * Default Modified Object Configuration for Each Theme
 * 
 * Each theme has default modified objects that get automatically created
 * when a user is assigned that theme.
 * 
 * TODO: Get actual values from product/planning team for:
 * - originalObjectId: Which original object to copy
 * - coordinates: Where to place it (x, y)
 * - modifications: Any custom properties (size, color, etc.)
 */

export interface DefaultModifiedObjectConfig {
  originalObjectId: string;  // ID of the original object to copy
  coordinates: {
    x: number;
    y: number;
  };
  isReversed: boolean;
  itemFunction: "Gallery" | "Link" | "Board" | null;
  additionalData?: any;
}

export interface ThemeColors {
  floorColor: string;
  leftWallColor: string;
  rightWallColor: string;
}

export interface ThemeConfig {
  id: number;
  name: string;
  characteristics: string[];
  description: string;
  colors: ThemeColors;
  defaultModifiedObjects: DefaultModifiedObjectConfig[];  // Changed to array of 2 objects
}

/**
 * Theme configurations with default modified objects
 * 
 * ⚠️ IMPORTANT: Replace placeholder values with actual data from product team
 */
export const THEME_CONFIGS: Record<number, ThemeConfig> = {
  1: {
    id: 1,
    name: "동심파",
    characteristics: ["순수함", "가족애", "따뜻함"],
    description: "어린 시절의 추억과 가족과의 유대감을 중시하는 따뜻하고 순수한 마음",
    colors: {
      floorColor: "#FFF2E5",
      leftWallColor: "#FFE5EC",
      rightWallColor: "#DFF3FF"
    },
    defaultModifiedObjects: [
      {
        // TODO: Replace with actual object ID from product team
        originalObjectId: "PLACEHOLDER_OBJECT_ID_1_1",
        coordinates: {
          x: 0.75,
          y: 0.4 
        },
        isReversed: false,
        itemFunction: null,
        additionalData: {
          themeSpecific: true,
          themeId: 1,
          objectIndex: 0
        }
      },
      {
        // TODO: Replace with actual object ID from product team
        originalObjectId: "PLACEHOLDER_OBJECT_ID_1_2",
        coordinates: {
          x: 0.3,
          y: 0.35
        },
        isReversed: false,
        itemFunction: null,
        additionalData: {
          themeSpecific: true,
          themeId: 1,
          objectIndex: 1
        }
      }
    ]
  },
  2: {
    id: 2,
    name: "낭만파",
    characteristics: ["감성", "예술", "사랑"],
    description: "감성적이고 예술적인 표현을 통해 사랑과 낭만을 삶의 중요한 가치로 여기는 성향",
    colors: {
      floorColor: "#7E6D5B",
      leftWallColor: "#FF952F",
      rightWallColor: "#9655FB"
    },
    defaultModifiedObjects: [
      {
        // TODO: Replace with actual object ID from product team
        originalObjectId: "PLACEHOLDER_OBJECT_ID_2_1",
        coordinates: {
          x: 0.85,
          y: 0.2
        },
        isReversed: false,
        itemFunction: null,
        additionalData: {
          themeSpecific: true,
          themeId: 2,
          objectIndex: 0
        }
      },
      {
        // TODO: Replace with actual object ID from product team
        originalObjectId: "PLACEHOLDER_OBJECT_ID_2_2",
        coordinates: {
          x: 0.35,
          y: 0.3
        },
        isReversed: false,
        itemFunction: null,
        additionalData: {
          themeSpecific: true,
          themeId: 2,
          objectIndex: 1
        }
      }
    ]
  },
  3: {
    id: 3,
    name: "도시파",
    characteristics: ["자립심", "열정", "세련됨"],
    description: "주체적이고 열정적인 태도로 현대적이고 세련된 감각을 추구하며 성취를 중시하는 성향",
    colors: {
      floorColor: "#B0ACAA",
      leftWallColor: "#DDDDDD",
      rightWallColor: "#2E2F2E"
    },
    defaultModifiedObjects: [
      {
        // TODO: Replace with actual object ID from product team
        originalObjectId: "PLACEHOLDER_OBJECT_ID_3_1",
        coordinates: {
          x: 0.75,
          y: 0.4
        },
        isReversed: false,
        itemFunction: null,
        additionalData: {
          themeSpecific: true,
          themeId: 3,
          objectIndex: 0
        }
      },
      {
        // TODO: Replace with actual object ID from product team
        originalObjectId: "PLACEHOLDER_OBJECT_ID_3_2",
        coordinates: {
          x: 0.3,
          y: 0.35
        },
        isReversed: false,
        itemFunction: null,
        additionalData: {
          themeSpecific: true,
          themeId: 3,
          objectIndex: 1
        }
      }
    ]
  },
  4: {
    id: 4,
    name: "자연파",
    characteristics: ["자연", "소박함", "평온함"],
    description: "복잡함보다는 단순함을 추구하며 자연 속에서의 평화와 여유로운 삶을 지향하는 성향",
    colors: {
      floorColor: "#CEB96C",
      leftWallColor: "#DDE88C",
      rightWallColor: "#C9B59B"
    },
    defaultModifiedObjects: [
      {
        // TODO: Replace with actual object ID from product team
        originalObjectId: "PLACEHOLDER_OBJECT_ID_4_1",
        coordinates: {
          x: 0.75,
          y: 0.4
        },
        isReversed: false,
        itemFunction: null,
        additionalData: {
          themeSpecific: true,
          themeId: 4,
          objectIndex: 0
        }
      },
      {
        // TODO: Replace with actual object ID from product team
        originalObjectId: "PLACEHOLDER_OBJECT_ID_4_2",
        coordinates: {
          x: 0.3,
          y: 0.35
        },
        isReversed: false,
        itemFunction: null,
        additionalData: {
          themeSpecific: true,
          themeId: 4,
          objectIndex: 1
        }
      }
    ]
  },
  5: {
    id: 5,
    name: "기억파",
    characteristics: ["추억", "그리움", "연결"],
    description: "과거의 인연을 소중히 여기고 깊은 그리움과 사람 간의 연결을 강조하는 성향",
    colors: {
      floorColor: "#8F5902",
      leftWallColor: "#8A9F71",
      rightWallColor: "#FFBB00"
    },
    defaultModifiedObjects: [
      {
        // TODO: Replace with actual object ID from product team
        originalObjectId: "PLACEHOLDER_OBJECT_ID_5_1",
        coordinates: {
          x: 0.75,
          y: 0.4
        },
        isReversed: false,
        itemFunction: null,
        additionalData: {
          themeSpecific: true,
          themeId: 5,
          objectIndex: 0
        }
      },
      {
        // TODO: Replace with actual object ID from product team
        originalObjectId: "PLACEHOLDER_OBJECT_ID_5_2",
        coordinates: {
          x: 0.3,
          y: 0.35
        },
        isReversed: false,
        itemFunction: null,
        additionalData: {
          themeSpecific: true,
          themeId: 5,
          objectIndex: 1
        }
      }
    ]
  }
};

/**
 * Get theme configuration by ID
 */
export function getThemeConfig(themeId: number): ThemeConfig | null {
  return THEME_CONFIGS[themeId] || null;
}

/**
 * Get default modified object configs for a theme (returns array of 2 objects)
 */
export function getDefaultModifiedObjectConfigs(themeId: number): DefaultModifiedObjectConfig[] | null {
  const config = THEME_CONFIGS[themeId];
  return config ? config.defaultModifiedObjects : null;
}

/**
 * Get theme colors by ID
 */
export function getThemeColors(themeId: number): ThemeColors | null {
  const config = THEME_CONFIGS[themeId];
  return config ? config.colors : null;
}
