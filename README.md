# mcp-diff

Text diff MCP.

Part of [Pipeworx](https://pipeworx.io) — an MCP gateway connecting AI agents to 1160+ live data sources.

## Tools

| Tool | Description |
|------|-------------|
| `diff_lines` | Compute a line-level diff between two texts (keyless, offline). Returns the change list (equal/add/remove), an added/removed/unchanged summary, and a unified-diff-style string with +/- prefixes. |

## Quick Start

Add to your MCP client (Claude Desktop, Cursor, Windsurf, etc.):

```json
{
  "mcpServers": {
    "diff": {
      "url": "https://gateway.pipeworx.io/diff/mcp"
    }
  }
}
```

Or connect to the full Pipeworx gateway for access to all 1160+ data sources:

```json
{
  "mcpServers": {
    "pipeworx": {
      "url": "https://gateway.pipeworx.io/mcp"
    }
  }
}
```

## Using with ask_pipeworx

Instead of calling tools directly, you can ask questions in plain English:

```
ask_pipeworx({ question: "your question about Diff data" })
```

The gateway picks the right tool and fills the arguments automatically.

## More

- [All tools and guides](https://github.com/pipeworx-io/examples)
- [pipeworx.io](https://pipeworx.io)

## License

MIT
