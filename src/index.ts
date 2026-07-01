interface McpToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

interface McpToolExport {
  tools: McpToolDefinition[];
  callTool: (name: string, args: Record<string, unknown>) => Promise<unknown>;
  meter?: { credits: number };
  cost?: Record<string, unknown>;
  provider?: string;
}

/**
 * Text diff MCP.
 *
 * Keyless, offline: compute a line-level diff between two texts (LCS-based),
 * returning the change list, an added/removed summary, and a unified-diff-style
 * string. Pure logic — no API, no key.
 */


const MAX = 3000; // line cap to bound the O(n*m) LCS table

function lcsDiff(a: string[], b: string[]): { type: 'equal' | 'add' | 'remove'; line: string }[] {
  const m = a.length, n = b.length;
  const dp: Uint32Array[] = Array.from({ length: m + 1 }, () => new Uint32Array(n + 1));
  for (let i = m - 1; i >= 0; i--) for (let j = n - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const out: { type: 'equal' | 'add' | 'remove'; line: string }[] = [];
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) { out.push({ type: 'equal', line: a[i] }); i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) { out.push({ type: 'remove', line: a[i] }); i++; }
    else { out.push({ type: 'add', line: b[j] }); j++; }
  }
  while (i < m) out.push({ type: 'remove', line: a[i++] });
  while (j < n) out.push({ type: 'add', line: b[j++] });
  return out;
}

const tools: McpToolExport['tools'] = [
  {
    name: 'diff_lines',
    description: 'Compute a line-level diff between two texts (keyless, offline). Returns the change list (equal/add/remove), an added/removed/unchanged summary, and a unified-diff-style string with +/- prefixes.',
    inputSchema: {
      type: 'object',
      properties: {
        a: { type: 'string', description: 'The original ("before") text.' },
        b: { type: 'string', description: 'The new ("after") text.' },
        context: { type: 'boolean', description: 'If true, include unchanged lines in the unified output (default true).' },
      },
      required: ['a', 'b'],
    },
  },
];

async function callTool(name: string, args: Record<string, unknown>): Promise<unknown> {
  if (name !== 'diff_lines') throw new Error(`Unknown tool: ${name}`);
  const aLines = str(args, 'a').split('\n');
  const bLines = str(args, 'b').split('\n');
  if (aLines.length > MAX || bLines.length > MAX) return { error: `Too many lines (max ${MAX} each).` };
  const changes = lcsDiff(aLines, bLines);
  const added = changes.filter((c) => c.type === 'add').length;
  const removed = changes.filter((c) => c.type === 'remove').length;
  const withContext = args.context !== false;
  const unified = changes
    .filter((c) => withContext || c.type !== 'equal')
    .map((c) => (c.type === 'add' ? '+ ' : c.type === 'remove' ? '- ' : '  ') + c.line)
    .join('\n');
  return { changed: added + removed > 0, summary: { added, removed, unchanged: changes.length - added - removed }, unified, changes: changes.length <= 500 ? changes : undefined, note: changes.length > 500 ? 'Change list omitted (large); see `unified`.' : undefined };
}

function str(args: Record<string, unknown>, key: string): string {
  const v = args[key];
  if (typeof v !== 'string') throw new Error(`Required argument "${key}" is missing (a string).`);
  return v;
}

export default { tools, callTool, meter: { credits: 1 } } satisfies McpToolExport;
