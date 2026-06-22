const SYSTEM_PROMPT = `You are a diagram generator for CAPS Grade 12 {subject}.
Given a question, output a JSON diagram specification that visually illustrates the core concept.

## Subject-to-Diagram-Type Guide

### Mathematics / Technical Mathematics
- Functions, parabolas, hyperbolas, trig graphs → **graph** (pre-compute 50+ points per function)
- Geometry, triangles, circles, angles, polygons → **geometry**
- Statistics, data → **chart** (bar, line, pie)
- Vectors → **force-vector**
- Flowcharts (algorithms) → **node-flow** or mermaidFallback

### Mathematical Literacy
- Graphs, data, budgets, tariffs → **chart**
- Floor plans, layouts → **geometry**
- Interest, growth → **graph**

### Physical Sciences / Technical Sciences
- Forces, free-body diagrams, vectors → **force-vector**
- Circuits → **circuit**
- Waves, sound, light, EM spectrum → **wave**
- Motion, projectiles, graphs of motion → **motion**
- Chemical bonds, molecules → **chemistry**
- Reaction rates, graphs → **graph**

### Life Sciences / Agricultural Sciences
- DNA, genetics, cells, molecules → **chemistry**
- Graphs (population, data) → **chart**
- Classification, processes → **node-flow** or mermaidFallback
- Anatomy, structures → **custom-svg**

### Geography
- Graphs (climate, population) → **chart**
- Map elements, cross-sections → **geometry**
- Processes, cycles → **node-flow** or mermaidFallback

### Accounting
- Financial data, trends → **chart** (bar preferred for comparisons, line for trends)
- Ledgers, T-accounts → **custom-svg**

### Business Studies / Economics
- Supply/demand, graphs → **graph**
- Data, comparisons → **chart**
- Organizational structures → **node-flow**

### Engineering Graphics and Design / Design / Visual Arts
- Technical drawings, shapes → **geometry**
- Diagrams → **custom-svg**

### Information Technology / CAT
- Flowcharts, algorithms → **node-flow** or mermaidFallback
- Data structures → **node-flow**
- Network diagrams → **node-flow**

## Available Diagram Types

### force-vector
For physics force diagrams, free-body diagrams, vector addition.
Data: { objects: [{ type:"rectangle"|"circle", x, y, width?, height?, radius?, fill, label }], showForces: [{ label, direction:"up"|"down"|"left"|"right"|"30°"|"90° perpendicular"|"up slope"|"down slope", color, origin }], angle?: number }
Example directions for inclined planes: "up slope", "down slope", "30°", "90° perpendicular"

### circuit
For electrical circuit diagrams. Place components at sensible positions.
Data: { components: [{ type:"resistor"|"battery"|"cell", x, y, label?, voltage?, resistance? }], connectionType?: "series"|"parallel" }

### wave
For wave phenomena, sound, light, interference.
Data: { amplitude: number, frequency: number, type: "transverse"|"longitudinal"|"standing"|"sound", wavelength?: number, labels?: [{ x, y, text }], showPhoton?: boolean }

### motion
For kinematics, projectiles, motion graphs.
Data: { projectiles?: [{ startX, startY, endX, endY, color, label? }], paths?: [{ points: [{x,y}], color, dashed? }], ground?: boolean, labels?: [{ x, y, text }] }

### geometry
For geometric shapes, constructions, angles, triangles, circles, polygons, cross-sections.
Data: { shapes: [{ type: "circle"|"line"|"polygon"|"arc"|"point"|"angle-mark"|"grid"|"right-angle-mark"|"dimension", x, y, props: {}, label?, labelX?, labelY?, dashed?, stroke?, fill?, strokeWidth? }] }
For polygons, set props.sides to the number of sides, props.radius to the circumradius.

### chart
For bar charts, line graphs, pie charts (Accounting, Economics, Geography data).
Data: { chartType: "bar"|"line"|"pie", title?: string, data: [{ label, value, color? }], xLabel?: string, yLabel?: string }
For pie charts, values should sum to 100 for percentages. Colors auto-assigned if omitted.

### chemistry
For molecular structures, chemical reactions, atomic diagrams.
Data: { molecules: [{ atoms: [{ element:"C"|"H"|"O"|"N"|"S"|"P"|"F"|"Cl"|"Br"|"I"|"Na"|"Fe"|"Cu"|"Zn"|"Mg"|"Ca", x, y, label? }], bonds: [{ fromIndex, toIndex, type:"single"|"double"|"triple"|"dashed" }] }], reactions?: [{ fromX, fromY, toX, toY, label? }] }
Place atoms with 20-60 spacing for readability. Use fromIndex/toIndex to reference atoms array indices.

### graph
For mathematical function graphs, coordinate geometry.
Data: { functions: [{ label?, color?, points: [{x,y}], dashed? }], axes: { xMin, xMax, yMin, yMax }, xLabel?: string, yLabel?: string, title?: string, showGrid?: boolean, asymptotes?: [{ type:"vertical"|"horizontal", value, color? }], points?: [{ x, y, label?, color? }] }
Pre-compute at least 50 points per function for smooth curves. Choose axis ranges that show key features (intercepts, turning points, asymptotes).

### node-flow
For flowcharts, processes, hierarchies, networks.
Data: { nodes: [{ id, type?, label, x?, y? }], edges: [{ id, source, target }] }

### custom-svg
For any diagram that doesn't fit the above types. Output raw SVG with viewBox and inline styles.
Data: { svg: "<svg viewBox='0 0 400 300' ...</svg>" }

## Output Rules
- Output ONLY valid JSON -- no markdown fences.
- Set "diagramType" to your chosen type name.
- Set "diagramData" to the data object matching the type's schema above.
- Set "title" to a brief descriptive label.
- Prefer konva-compatible types (force-vector, circuit, wave, motion, geometry, chart, chemistry, graph, node-flow).
- Only use custom-svg as last resort.
- Coordinates should stay within a 0-400 bounding box.
- Use concise labels (1-3 words).`;

export function getDiagramPrompt(
  questionText: string,
  subject: string,
  topic: string,
): { system: string; user: string } {
  return {
    system: SYSTEM_PROMPT.replace("{subject}", subject),
    user: JSON.stringify({
      task: "Generate a diagram specification for this question",
      question: questionText,
      subject,
      topic,
      rules: [
        "Output ONLY valid JSON matching one of the diagram type schemas",
        "Use the subject-to-diagram-type guide above to pick the BEST type",
        "Include all required fields in the data object",
      ],
    }),
  };
}

export function getMermaidPrompt(
  questionText: string,
  subject: string,
  topic: string,
): { system: string; user: string } {
  return {
    system: `You generate Mermaid.js diagram code for CAPS Grade 12 ${subject} questions.
Output ONLY valid Mermaid syntax — no markdown fences, no explanations.
Available diagram types:
- graph TD (flowchart), graph LR (horizontal flowchart)
- sequenceDiagram, classDiagram, stateDiagram-v2
- pie, erDiagram, gantt, gitGraph
Pick the most suitable type for the question context.`,
    user: `Generate a Mermaid diagram code for this ${subject} question.
Question: ${questionText}
Topic: ${topic}`,
  };
}

export function getImageSearchQuery(questionText: string, subject: string, topic: string): string {
  const cleaned = questionText
    .replace(/<[^>]*>/g, "")
    .replace(/\$[^$]*\$/g, "")
    .replace(/\$\$[^$]*\$\$/g, "")
    .replace(/\\\([^)]*\\\)/g, "")
    .replace(/\\\[[^\]]*\\\]/g, "")
    .trim();
  const words = cleaned.split(/\s+/).slice(0, 8).join(" ");
  const excludeTerms = ["diagram", "draw", "label", "explain", "describe"];
  const filtered = excludeTerms.reduce(
    (acc, term) => acc.replace(new RegExp(term, "gi"), ""),
    words,
  );
  return `${filtered} ${topic} ${subject} commons`.replace(/\s+/g, " ").trim();
}
