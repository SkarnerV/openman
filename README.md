# Openman

<div align="center">
  <strong>A modern API Testing Tool for HTTP, gRPC, and MCP services</strong>
  <br />
  <sub>Built with Tauri + React + TypeScript</sub>
</div>

<br />

<div align="center">
  <a href="#features">Features</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#development">Development</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#license">License</a>
</div>

<br />

## Features

### HTTP Testing (Full Postman Parity)

- ✅ **Request Builder** - Method selection, URL with variable interpolation, query params, headers
- ✅ **Multiple Body Types** - JSON, form-data, x-www-form-urlencoded, raw, binary
- ✅ **Authorization** - Bearer, Basic, API Key, OAuth2
- ✅ **Collections** - Hierarchical organization with folders
- ✅ **Environments** - Multiple environments with variable scopes
- ✅ **Scripts** - Pre-request and test scripts
- ✅ **Import/Export** - Postman Collection v2.1, cURL, OpenAPI

### gRPC Testing

- ✅ **Proto File Loading** - Load and parse .proto files
- ✅ **Service Discovery** - List services and methods
- ✅ **Unary Calls** - Send and receive gRPC messages
- ✅ **Message Editor** - JSON format message editing

### MCP Testing (Model Context Protocol)

- ✅ **Server Connection** - Connect to stdio, HTTP, WebSocket MCP servers
- ✅ **Tool Testing** - List and invoke tools
- ✅ **Resource Testing** - Read resources and subscribe to updates
- ✅ **Prompt Testing** - Test prompt templates
- ✅ **Sampling Support** - LLM sampling capabilities

### General

- 🎨 **Modern UI** - Clean, intuitive interface
- 🌙 **Dark/Light Theme** - Customizable themes
- 💾 **Local Storage** - JSON-based, git-friendly
- 🔒 **Secure** - Encrypted storage for secrets
- ⚡ **Fast** - Native performance with Tauri/Rust

## Getting Started

### Prerequisites

- **Node.js** 18+ and npm
- **Rust** (latest stable)
- **Platform-specific dependencies**:
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Microsoft Visual Studio C++ Build Tools
  - **Linux**: `webkit2gtk`, `openssl`, `curl`, `wget`, `file`

### Installation

```bash
# Clone the repository
git clone https://github.com/skarner/openman.git
cd openman

# Install dependencies
npm install

# Run in development mode
npm run tauri dev
```

### Build for Production

```bash
# Build the application
npm run tauri build
```

The built application will be in `src-tauri/target/release/bundle/`.

## Development

### Project Structure

```
openman/
├── src/                    # React frontend
│   ├── components/         # UI components
│   │   ├── http/          # HTTP testing components
│   │   ├── grpc/          # gRPC testing components
│   │   ├── mcp/           # MCP testing components
│   │   └── layout/        # Layout components
│   ├── stores/            # Zustand state stores
│   ├── services/          # Tauri command wrappers
│   ├── hooks/             # React hooks
│   └── types/             # TypeScript types
│
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── commands/      # Tauri command handlers
│   │   ├── engines/       # HTTP/gRPC/MCP engines
│   │   ├── models/        # Data models
│   │   ├── storage/       # File storage layer
│   │   └── utils/         # Utilities
│   └── Cargo.toml
│
└── plans/                  # Architecture documents
```

### Tech Stack

| Layer              | Technology            |
| ------------------ | --------------------- |
| Frontend Framework | React 18 + TypeScript |
| State Management   | Zustand               |
| Styling            | Tailwind CSS          |
| Build Tool         | Vite                  |
| Desktop Framework  | Tauri 2               |
| Backend Language   | Rust                  |
| HTTP Client        | reqwest               |
| gRPC               | tonic + prost         |

### Available Scripts

| Command               | Description             |
| --------------------- | ----------------------- |
| `npm run dev`         | Start Vite dev server   |
| `npm run build`       | Build frontend          |
| `npm run tauri dev`   | Run in development mode |
| `npm run tauri build` | Build production app    |
| `npm run lint`        | Run ESLint              |

## Architecture

See [plans/openman-architecture.md](plans/openman-architecture.md) for detailed architecture documentation.

### System Overview

```
┌─────────────────────────────────────────┐
│           React Frontend                 │
│  ┌─────────┬─────────┬─────────┐        │
│  │   HTTP  │  gRPC   │   MCP   │        │
│  └────┬────┴────┬────┴────┬────┘        │
│       │         │         │              │
│  ┌────┴─────────┴─────────┴────┐        │
│  │      Zustand Stores         │        │
│  └────────────┬────────────────┘        │
└───────────────┼─────────────────────────┘
                │ Tauri IPC
┌───────────────┼─────────────────────────┐
│           Rust Backend                   │
│  ┌────────────┴───────────────┐         │
│  │      Tauri Commands         │         │
│  └────┬────────┬────────┬──────┘         │
│       │        │        │                 │
│  ┌────┴──┐ ┌───┴───┐ ┌──┴────┐          │
│  │ HTTP  │ │ gRPC  │ │  MCP  │          │
│  │Engine │ │Engine │ │Engine │          │
│  └───────┘ └───────┘ └───────┘          │
│                                          │
│  ┌───────────────────────────────┐      │
│  │        JSON Storage            │      │
│  └───────────────────────────────┘      │
└──────────────────────────────────────────┘
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Roadmap

- [ ] HTTP core features (request builder, response viewer)
- [ ] Collections and environments
- [ ] Script runtime (pre-request, tests)
- [ ] Postman import/export
- [ ] gRPC support (unary calls)
- [ ] MCP support (tools, resources, prompts)
- [ ] CLI version
- [ ] VS Code extension
- [ ] Cloud sync (optional)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Tauri](https://tauri.app/) - Build smaller, faster, and more secure desktop apps
- [Postman](https://www.postman.com/) - Inspiration for the project
- [Hoppscotch](https://hoppscotch.io/) - Open-source API testing tool
