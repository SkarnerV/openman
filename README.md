<div align="center">

  <img src="docs/logo.png" alt="Openman Logo" width="120" height="120">

  <h1>Openman</h1>

  <p><strong>A modern, open-source API Testing Tool for HTTP, gRPC, and MCP services</strong></p>

  <p>
    <em>Postman alternative built with Tauri + React + TypeScript + Rust</em>
  </p>

  <p>
    <a href="https://github.com/skarner/openman/actions/workflows/ci.yml">
      <img src="https://github.com/skarner/openman/actions/workflows/ci.yml/badge.svg" alt="CI Status">
    </a>
    <a href="https://github.com/skarner/openman/blob/main/LICENSE">
      <img src="https://img.shields.io/github/license/skarner/openman" alt="License">
    </a>
    <a href="https://github.com/skarner/openman/releases">
      <img src="https://img.shields.io/github/v/release/skarner/openman?include_prereleases" alt="Version">
    </a>
    <a href="https://github.com/skarner/openman/issues">
      <img src="https://img.shields.io/github/issues/skarner/openman" alt="Issues">
    </a>
    <a href="https://github.com/skarner/openman/pulls">
      <img src="https://img.shields.io/github/issues-pr/skarner/openman" alt="Pull Requests">
    </a>
  </p>

  <p>
    <a href="#-features">Features</a> •
    <a href="#-installation">Installation</a> •
    <a href="#-getting-started">Getting Started</a> •
    <a href="#-development">Development</a> •
    <a href="#-contributing">Contributing</a> •
    <a href="#-roadmap">Roadmap</a>
  </p>

  <br>

  <img src="docs/screenshot.png" alt="Openman Screenshot" width="100%">

</div>

---

## Why Openman?

Openman is a lightweight, fast, and secure alternative to Postman for testing APIs. It supports not only HTTP REST APIs but also gRPC services and the emerging MCP (Model Context Protocol) for AI agents.

| Feature | Openman | Postman | Hoppscotch |
|---------|---------|---------|------------|
| HTTP Testing | ✅ | ✅ | ✅ |
| gRPC Testing | ✅ | ✅ | ❌ |
| MCP Testing | ✅ | ❌ | ❌ |
| Offline-first | ✅ | Partial | ✅ |
| Open Source | ✅ MIT | ❌ | ✅ MIT |
| Native Desktop | ✅ Tauri | Electron | Web/PWA |
| Memory Usage | ~50MB | ~500MB | Browser |
| Local Storage | JSON files | IndexedDB | LocalStorage |

## Features

### HTTP/REST API Testing

- **Request Builder** - Full-featured request editor with method selection, URL with variable interpolation, query parameters, and headers
- **Multiple Body Types** - JSON, form-data, x-www-form-urlencoded, raw text, and binary file upload
- **Authorization** - Bearer Token, Basic Auth, API Key, OAuth2 support
- **Collections** - Hierarchical organization with folders for organizing your API requests
- **Environments** - Multiple environment profiles with variable scopes for different deployment stages
- **Pre-request Scripts** - JavaScript runtime for dynamic request modification
- **Test Scripts** - Write assertions and validate responses automatically
- **Import/Export** - Postman Collection v2.1, cURL commands, OpenAPI 3.0 specifications

### gRPC Testing

- **Proto File Loading** - Load and parse `.proto` files with full schema discovery
- **Service Discovery** - Automatically list all services and methods from proto definitions
- **Unary Calls** - Send and receive gRPC unary messages
- **Streaming** - Server streaming and client streaming support (coming soon)
- **Message Editor** - JSON format for editing gRPC request messages
- **Metadata Support** - Add custom metadata to gRPC calls

### MCP Testing (Model Context Protocol)

- **Server Connection** - Connect to stdio, HTTP SSE, and WebSocket MCP servers
- **Tool Testing** - List available tools and invoke them with custom parameters
- **Resource Testing** - Read resources and subscribe to real-time updates
- **Prompt Testing** - Test prompt templates with parameter substitution
- **Sampling Support** - LLM sampling capabilities for AI-powered workflows

### General Features

- **Modern UI** - Clean, intuitive interface inspired by VS Code
- **Dark/Light Theme** - Customizable themes with system preference detection
- **Local-first Storage** - JSON-based, git-friendly project files
- **Secure Storage** - Encrypted storage for sensitive secrets and credentials
- **Fast Performance** - Native performance powered by Rust/Tauri backend
- **Keyboard Shortcuts** - Efficient workflow with customizable keybindings
- **History** - Track all requests with timestamps and replay capability
- **Cross-platform** - macOS, Windows, and Linux support

## Installation

### Download Pre-built Releases

Download the latest release for your platform from the [Releases](https://github.com/skarner/openman/releases) page:

| Platform | Download |
|----------|----------|
| macOS (Apple Silicon) | `Openman_x.x.x_aarch64.dmg` |
| macOS (Intel) | `Openman_x.x.x_x64.dmg` |
| Windows | `Openman_x.x.x_x64-setup.exe` |
| Linux | `Openman_x.x.x_amd64.AppImage` |

### Build from Source

<details>
<summary>Prerequisites</summary>

- **Node.js** 18+ and npm
- **Rust** (latest stable version)
- **Platform-specific dependencies**:

  **macOS:**
  ```bash
  xcode-select --install
  ```

  **Windows:**
  - Install [Microsoft Visual Studio C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
  - Install [WebView2](https://developer.microsoft.com/microsoft-edge/webview2/) (usually pre-installed on Windows 10/11)

  **Linux (Ubuntu/Debian):**
  ```bash
  sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget file libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev
  ```

  **Linux (Arch):**
  ```bash
  sudo pacman -S webkit2gtk-4.1 base base-devel curl wget file openssl gtk3 libayatana-appindicator librsvg
  ```
</details>

<details open>
<summary>Build Instructions</summary>

```bash
# Clone the repository
git clone https://github.com/skarner/openman.git
cd openman

# Install dependencies
npm install

# Build the application
npm run tauri build
```

The built application will be available in `src-tauri/target/release/bundle/`.
</details>

## Getting Started

### Quick Start

1. **Create a Collection** - Organize your API requests into collections
2. **Add a Request** - Click "New Request" and enter your API endpoint
3. **Send Request** - Configure headers, body, and authentication, then click "Send"
4. **View Response** - Inspect the response body, headers, and status code

### Basic Usage

<details>
<summary>HTTP Request Example</summary>

```json
// Request
{
  "method": "GET",
  "url": "https://api.example.com/users",
  "headers": {
    "Authorization": "Bearer {{token}}"
  }
}

// Response
{
  "status": 200,
  "body": {
    "users": [...]
  }
}
```
</details>

<details>
<summary>gRPC Request Example</summary>

1. Load a `.proto` file
2. Select a service and method
3. Enter the request message in JSON format
4. Click "Invoke" to send the call
</details>

<details>
<summary>MCP Testing Example</summary>

1. Configure MCP server connection (stdio/HTTP/WebSocket)
2. Browse available tools, resources, and prompts
3. Test tool invocation with parameters
4. Subscribe to resource updates
</details>

## Development

### Project Structure

```
openman/
├── src/                    # React frontend
│   ├── components/         # UI components
│   │   ├── http/          # HTTP testing components
│   │   ├── grpc/          # gRPC testing components
│   │   ├── mcp/           # MCP testing components
│   │   ├── common/        # Shared UI components
│   │   └── layout/        # Layout components
│   ├── pages/             # Page components
│   ├── stores/            # Zustand state management
│   ├── services/          # API services and utilities
│   ├── hooks/             # Custom React hooks
│   ├── types/             # TypeScript type definitions
│   └── test/              # Test utilities and setup
│
├── src-tauri/              # Rust backend
│   ├── src/
│   │   ├── commands/      # Tauri IPC command handlers
│   │   ├── engines/       # HTTP/gRPC/MCP engines
│   │   ├── models/        # Data models and schemas
│   │   ├── storage/       # File storage layer
│   │   └── utils/         # Utility functions
│   └── Cargo.toml         # Rust dependencies
│
├── e2e/                    # Playwright E2E tests
├── .storybook/             # Storybook configuration
├── docs/                   # Documentation and assets
└── plans/                  # Architecture documents
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend Framework | React 18 + TypeScript | UI components |
| State Management | Zustand | Global state |
| Styling | Tailwind CSS | Utility-first styling |
| Code Editor | Monaco Editor | JSON/XML editing |
| Build Tool | Vite | Fast bundling |
| Desktop Framework | Tauri 2 | Native wrapper |
| Backend Language | Rust | High-performance core |
| HTTP Client | reqwest | HTTP requests |
| gRPC Client | tonic + prost | gRPC communication |
| Testing (Unit) | Vitest | Unit tests |
| Testing (E2E) | Playwright | Browser tests |
| Component Docs | Storybook | UI documentation |

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite development server |
| `npm run build` | Build frontend for production |
| `npm run preview` | Preview production build |
| `npm run tauri dev` | Run full application in development mode |
| `npm run tauri build` | Build production application |
| `npm run lint` | Run ESLint code linting |
| `npm run test` | Run unit tests in watch mode |
| `npm run test:run` | Run unit tests once |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Run E2E tests with UI |
| `npm run test:all` | Run all tests (unit + E2E) |
| `npm run storybook` | Start Storybook development server |
| `npm run build-storybook` | Build static Storybook site |

### Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  ┌───────────────┬───────────────┬───────────────┐     │
│  │  HTTP Panel   │  gRPC Panel   │   MCP Panel   │     │
│  └───────────────┴───────────────┴───────────────┘     │
│                          │                               │
│  ┌───────────────────────┴───────────────────────┐     │
│  │              Zustand State Stores              │     │
│  │  ┌─────────┬─────────┬─────────┬─────────┐    │     │
│  │  │ Request │Collection│Environment│ Theme │    │     │
│  │  └─────────┴─────────┴─────────┴─────────┘    │     │
│  └───────────────────────┬───────────────────────┘     │
└──────────────────────────┼─────────────────────────────┘
                           │ Tauri IPC Bridge
┌──────────────────────────┼─────────────────────────────┐
│                    Rust Backend                         │
│  ┌───────────────────────┴───────────────────────┐     │
│  │              Tauri Command Handlers            │     │
│  └───────────────────────┬───────────────────────┘     │
│            ┌─────────────┼─────────────┐               │
│            │             │             │               │
│  ┌─────────┴───┐ ┌───────┴───┐ ┌──────┴────┐         │
│  │ HTTP Engine │ │gRPC Engine│ │MCP Engine │         │
│  │  (reqwest)  │ │  (tonic)  │ │ (custom)  │         │
│  └─────────────┘ └───────────┘ └───────────┘         │
│                                                         │
│  ┌─────────────────────────────────────────────┐      │
│  │              JSON File Storage               │      │
│  │  Collections │ Environments │ Settings │ ...│      │
│  └─────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

For detailed architecture documentation, see [plans/openman-architecture.md](plans/openman-architecture.md).

## Contributing

We welcome contributions from the community! Here's how you can help:

### Ways to Contribute

- **Report Bugs** - Open an issue with detailed reproduction steps
- **Suggest Features** - Share your ideas in GitHub Discussions
- **Submit Pull Requests** - Fix bugs or implement new features
- **Improve Documentation** - Help us clarify and expand our docs
- **Translate** - Help make Openman accessible in more languages

### Development Workflow

```bash
# 1. Fork the repository on GitHub

# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/openman.git
cd openman

# 3. Create a feature branch
git checkout -b feature/amazing-feature

# 4. Make your changes and run tests
npm run test:all
npm run lint

# 5. Commit your changes
git commit -m 'feat: add amazing feature'

# 6. Push to your branch
git push origin feature/amazing-feature

# 7. Open a Pull Request
```

### Commit Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Code Style

- TypeScript for all frontend code
- ESLint for code linting
- Prettier formatting (configured in ESLint)
- Rust formatting with `rustfmt`

## Roadmap

### Current Progress

- [x] HTTP core features (request builder, response viewer)
- [x] Collections and environments management
- [x] Modern UI with dark/light themes
- [x] Local JSON storage
- [x] gRPC support (proto loading, unary calls)
- [x] MCP support (tools, resources, prompts)

### Upcoming Features

- [ ] Pre-request and test script runtime
- [ ] Postman Collection import/export
- [ ] OpenAPI/Swagger import
- [ ] cURL import/export
- [ ] gRPC streaming support
- [ ] WebSocket testing
- [ ] GraphQL support
- [ ] CLI version for terminal workflows
- [ ] VS Code extension
- [ ] Team collaboration (optional cloud sync)
- [ ] Mock server functionality
- [ ] API documentation generator

## License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

Openman is inspired by and built upon these amazing projects:

- [Tauri](https://tauri.app/) - Build smaller, faster, and more secure desktop apps
- [Postman](https://www.postman.com/) - The API platform that inspired this project
- [Hoppscotch](https://hoppscotch.io/) - Open-source API development ecosystem
- [HTTPie](https://httpie.io/) - Human-friendly command-line HTTP client
- [grpcurl](https://github.com/fullstorydev/grpcurl) - Command-line gRPC tool

---

<div align="center">

  **Made with by [Skarner Han](https://github.com/skarner)**

  [Website](#) · [Documentation](#) · [Blog](#) · [Twitter](#)

  If you find Openman useful, please consider giving it a star

  <a href="https://github.com/skarner/openman/stargazers">
    <img src="https://img.shields.io/github/stars/skarner/openman?style=social" alt="Stars">
  </a>

</div>