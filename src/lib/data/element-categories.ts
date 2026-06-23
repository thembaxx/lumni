export interface ElementCategoryConfig {
  bg: string;
  label: string;
  rgb: string;
}

export const elementCategoryConfig: Record<string, ElementCategoryConfig> = {
  "alkali-metal": {
    bg: "bg-[--el-alkali]",
    label: "Alkali",
    rgb: "59.3% 0.194 28°",
  },
  "alkaline-earth": {
    bg: "bg-[--el-alkaline]",
    label: "Alkaline",
    rgb: "69.6% 0.196 49°",
  },
  "transition-metal": {
    bg: "bg-[--el-transition]",
    label: "Transition",
    rgb: "78.6% 0.156 80°",
  },
  "post-transition": {
    bg: "bg-[--el-post-trans]",
    label: "Post-Trans",
    rgb: "64.8% 0.173 142°",
  },
  metalloid: {
    bg: "bg-[--el-metalloid]",
    label: "Metalloid",
    rgb: "66.4% 0.125 186°",
  },
  nonmetal: {
    bg: "bg-[--el-nonmetal]",
    label: "Nonmetal",
    rgb: "66.1% 0.142 210°",
  },
  halogen: {
    bg: "bg-[--el-halogen]",
    label: "Halogen",
    rgb: "52% 0.18 146°",
  },
  "noble-gas": {
    bg: "bg-[--el-noble]",
    label: "Noble Gas",
    rgb: "88% 0.06 146°",
  },
  lanthanide: {
    bg: "bg-[--el-lanthanide]",
    label: "Lanthanide",
    rgb: "72% 0.08 146°",
  },
  actinide: {
    bg: "bg-[--el-actinide]",
    label: "Actinide",
    rgb: "52% 0.18 146°",
  },
  unknown: {
    bg: "bg-[--el-unknown]",
    label: "Unknown",
    rgb: "70.3% 0.012 146°",
  },
};

export const elementCategoryVariables = `
  :root {
    --el-alkali: #D43030;
    --el-alkaline: #A76519;
    --el-transition: #956D12;
    --el-post-trans: #2C8566;
    --el-metalloid: #3A7A3A;
    --el-nonmetal: #2868A8;
    --el-halogen: #4050A8;
    --el-noble: #5830A0;
    --el-lanthanide: #A04070;
    --el-actinide: #985040;
    --el-unknown: #707070;
  }
`;

export const elementEaseOutQuart = [0.25, 1, 0.5, 1] as const;
export const elementEaseOutQuint = [0.22, 1, 0.36, 1] as const;
export const elementEaseOutExpo = [0.16, 1, 0.3, 1] as const;
export const elementEaseOutBack = [0.34, 1.56, 0.64, 1] as const;
