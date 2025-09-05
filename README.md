# what-todo-next

A modern cross-platform desktop todo application built with Tauri and TypeScript. The next evolution of what-todo-for-rust, featuring a clean modern design, local SQLite storage, and native performance without the memory overhead of Electron.

## Features

- **Cross-platform**: Windows and Linux support
- **Lightweight**: Native performance with minimal memory usage
- **Local storage**: SQLite database for offline functionality
- **Modern design**: Clean, corporate-style interface
- **Fast startup**: Quick application launch times
- **Type-safe**: Built with TypeScript and Rust

## Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [pnpm](https://pnpm.io/) package manager
- [Rust](https://rustup.rs/) toolchain
- Platform-specific dependencies:
  - **Windows**: Microsoft C++ Build Tools
  - **Linux**: `webkit2gtk` development packages

## Development

1. Clone the repository:

   ```bash
   git clone https://github.com/NotKeira/what-todo-next.git
   cd what-todo-next
   ```

2. Install dependencies:

   ```bash
   # Frontend dependencies
   cd frontend && pnpm install

   # Backend dependencies
   cd ../backend && cargo check
   ```

3. Run in development mode:

   ```bash
   # Frontend (from frontend/ directory)
   cd frontend && pnpm dev

   # Backend (from backend/ directory)
   cd backend && cargo run
   ```

4. Build for production:

   ```bash
   # Frontend (from frontend/ directory)
   cd frontend && pnpm build

   # Backend (from backend/ directory)
   cd backend && cargo build --release
   ```

## Technologies

- **Frontend**: TypeScript, HTML5, CSS3
- **Backend**: Rust
- **Database**: SQLite
- **Framework**: Tauri
- **Build Tool**: Vite

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and ensure code quality
5. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Related Projects

- [what-todo-for-rust](https://github.com/NotKeira/what-todo-for-rust) - The original TUI version
