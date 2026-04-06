// ==========================================
// AI Copilot Engine - Rule-based responses
// ==========================================

import { Clash, MEPElement } from './clashEngine';

interface CopilotContext {
  clashes?: Clash[];
  elements?: MEPElement[];
  selectedClash?: Clash;
}

const RESPONSES: Record<string, (ctx: CopilotContext) => string> = {
  'help': () => `## 🤖 BIM Copilot Commands

Here's what I can help with:

- **"analyze clashes"** — Summary of all detected clashes
- **"show hard clashes"** — Filter critical hard clashes
- **"suggest fix"** — Get rerouting suggestions
- **"summary"** — Project overview
- **"rules"** — Show clearance rules
- **"export"** — Export clash report

Just type naturally — I understand context!`,

  'analyze': (ctx) => {
    if (!ctx.clashes?.length) return "No clashes detected yet. Please upload an IFC model and run clash detection first.";
    const hard = ctx.clashes.filter(c => c.type === 'hard').length;
    const soft = ctx.clashes.filter(c => c.type === 'soft').length;
    const clearance = ctx.clashes.filter(c => c.type === 'clearance').length;
    return `## 📊 Clash Analysis Report

**Total Clashes:** ${ctx.clashes.length}

| Type | Count | Priority |
|------|-------|----------|
| 🔴 Hard | ${hard} | Critical |
| 🟡 Soft | ${soft} | Medium |
| 🔵 Clearance | ${clearance} | Low |

**Avg Severity:** ${(ctx.clashes.reduce((s, c) => s + c.severity, 0) / ctx.clashes.length * 100).toFixed(1)}%

### Recommendations
${hard > 0 ? `- ⚠️ **${hard} hard clashes** require immediate attention — physical intersections detected` : ''}
${soft > 0 ? `- 🔧 **${soft} soft clashes** — spacing violations, consider rerouting` : ''}
${clearance > 0 ? `- 📐 **${clearance} clearance issues** — review against project standards` : ''}`;
  },

  'hard': (ctx) => {
    const hard = ctx.clashes?.filter(c => c.type === 'hard') || [];
    if (!hard.length) return "✅ No hard clashes found! Great news.";
    return `## 🔴 Hard Clashes (${hard.length})

${hard.slice(0, 5).map(c => `- **${c.id}**: ${c.elementA.name} ↔ ${c.elementB.name}
  - Penetration: ${c.penetrationDepth.toFixed(1)}mm
  - Location: Level ${c.elementA.level}
  - Severity: ${(c.severity * 100).toFixed(0)}%`).join('\n\n')}

${hard.length > 5 ? `\n*...and ${hard.length - 5} more*` : ''}`;
  },

  'fix': (ctx) => {
    const withRoutes = ctx.clashes?.filter(c => c.suggestedReroute) || [];
    if (!withRoutes.length) return "No rerouting suggestions available. Run clash detection first.";
    return `## 🔧 Rerouting Suggestions

${withRoutes.slice(0, 4).map(c => `### ${c.id} — ${c.type.toUpperCase()}
- **Action:** ${c.suggestedReroute!.description}
- **Offset:** ${c.suggestedReroute!.offsetDistance.toFixed(0)}mm
- **Confidence:** ${(c.suggestedReroute!.confidence * 100).toFixed(0)}%
- **Elements:** ${c.elementA.name} ↔ ${c.elementB.name}`).join('\n\n')}

> 💡 These are algorithmic suggestions. Always verify against project constraints before applying.`;
  },

  'summary': (ctx) => {
    const elemCount = ctx.elements?.length || 0;
    const disciplines = [...new Set(ctx.elements?.map(e => e.discipline) || [])];
    return `## 📋 Project Summary

- **Elements Loaded:** ${elemCount}
- **Disciplines:** ${disciplines.join(', ') || 'None'}
- **Clashes Found:** ${ctx.clashes?.length || 0}
- **Resolved:** ${ctx.clashes?.filter(c => c.status === 'resolved').length || 0}

${elemCount === 0 ? '> Upload an IFC model to get started!' : '> Model loaded and ready for analysis.'}`;
  },

  'rules': () => `## 📐 Clearance Rules

| Discipline A | Discipline B | Min Clearance |
|-------------|-------------|---------------|
| Mechanical | Electrical | 150mm |
| Mechanical | Plumbing | 100mm |
| Electrical | Plumbing | 75mm |
| Mechanical | Structural | 50mm |
| Electrical | Structural | 25mm |
| Plumbing | Structural | 50mm |

> Rules follow industry standards. Custom rules can be configured in the Rule Engine.`,

  'export': (ctx) => {
    if (!ctx.clashes?.length) return "No clash data to export. Run detection first.";
    return `## 📤 Export Ready

**Clash Report** generated with ${ctx.clashes.length} entries.

Available formats:
- 📄 JSON (structured data)
- 📊 CSV (spreadsheet)
- 📋 PDF (formatted report)

> Click the **Export** button in the Clash Results table to download.`;
  },
};

function matchIntent(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('help') || lower === 'hi' || lower === 'hello') return 'help';
  if (lower.includes('analyz') || lower.includes('detect') || lower.includes('overview')) return 'analyze';
  if (lower.includes('hard') || lower.includes('critical') || lower.includes('severe')) return 'hard';
  if (lower.includes('fix') || lower.includes('reroute') || lower.includes('suggest') || lower.includes('solution')) return 'fix';
  if (lower.includes('summar') || lower.includes('status') || lower.includes('project')) return 'summary';
  if (lower.includes('rule') || lower.includes('clearance') || lower.includes('standard')) return 'rules';
  if (lower.includes('export') || lower.includes('report') || lower.includes('download')) return 'export';
  return 'help';
}

export async function getCopilotResponse(message: string, context: CopilotContext): Promise<string> {
  // Simulate thinking time
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
  
  const intent = matchIntent(message);
  const handler = RESPONSES[intent];
  return handler ? handler(context) : RESPONSES['help'](context);
}
