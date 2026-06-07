# Finalyst - Enterprise AI Workstation & FDE IDE Engine

Finalyst is an advanced, real-time AI-powered IDE and automation engine built specifically for Forward Deployed Engineering (FDE) workflows. It provides a secure, in-browser workspace designed to bridge the gap between complex AI agents, data extraction pipelines, and high-value business workflows in sectors like Private Equity and Search Funds.

---

## Key Capabilities

*   **Secure In-Browser Sandboxing**: Leverages WebContainers to run local execution runtimes (Node.js, python scripts, scrapers) directly inside the user's browser sandbox, ensuring sensitive financial documents never leave the client's local perimeter unnecessarily.
*   **Structured AI Extractions**: Integrates directly with Anthropic Claude and Google Gemini models, backed by robust JSON/Pydantic validation schemas to guarantee deterministic, hallucination-free outputs.
*   **Workflow Orchestration**: Powered by Inngest for event-driven, non-blocking background jobs (e.g., automated document audits, company sourcing pipelines).
*   **Real-time Collaboration**: Built on Convex reactive database, synchronizing file states, project structures, and chat contexts in real time.
*   **Developer & FDE Tooling**: Full CodeMirror 6 editor integration, multi-file workspace navigator, terminal emulation with xterm.js, and inline AI helper utilities (Cmd+K, selection tooltips).

---

## Tech Stack

| Component | Technology |
| :--- | :--- |
| **Frontend Framework** | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| **Real-Time Backend & DB** | Convex |
| **Asynchronous Jobs** | Inngest |
| **Sandboxed Execution** | WebContainer API, xterm.js |
| **Text Editor Engine** | CodeMirror 6 (with Custom Linting & Minimap) |
| **Web Scraping / Sourcing** | Firecrawl |
| **Error & LLM Tracking** | Sentry |
| **Authentication** | Clerk (GitHub OAuth Integration) |

---

## Getting Started

### Prerequisites

*   Node.js 20.09+
*   npm or pnpm

### Environment Configuration

Create a `.env.local` file in the root directory:

```env
# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_pub_key
CLERK_SECRET_KEY=your_clerk_secret_key

# Real-time Database (Convex)
NEXT_PUBLIC_CONVEX_URL=your_convex_deployment_url
CONVEX_DEPLOYMENT=your_convex_deployment_id
POLARIS_CONVEX_INTERNAL_KEY=your_custom_internal_key

# AI API Providers (At least one required)
ANTHROPIC_API_KEY=your_anthropic_api_key
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key

# Sourcing & Data Extraction (Firecrawl)
FIRECRAWL_API_KEY=your_firecrawl_api_key

# Monitoring (Sentry)
SENTRY_DSN=your_sentry_dsn
```

### Installation & Run

1.  **Install dependencies**:
    ```bash
    npm install
    ```

2.  **Start the Convex dev server**:
    ```bash
    npx convex dev
    ```

3.  **Start the Inngest background runner**:
    ```bash
    npx inngest-cli@latest dev
    ```

4.  **Start the Next.js development server**:
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) to access the Finalyst dashboard.

---

## Project Structure

```
src/
├── app/                    # Next.js App Router (Dashboard, IDE pages, API routes)
├── components/            # Reusable UI components & AI message layouts
├── features/
│   ├── auth/             # Clerk OAuth & Session guards
│   ├── conversations/    # Real-time AI chat stream components
│   ├── editor/           # CodeMirror 6 configs, syntax highlights, and minimap
│   ├── preview/          # WebContainer runner & terminal bindings
│   └── projects/         # Multi-file workspaces
├── inngest/              # Event-driven workflow client and triggers
└── lib/                  # Central API clients (Convex, Clerk, Sentry, Firecrawl)

convex/
├── schema.ts             # Convex relational schema (Files, Projects, Messages, Conversations)
├── projects.ts           # Real-time project operations
├── files.ts              # Optimistic file-system tree mutations
├── conversations.ts      # Thread histories and messages
└── system.ts             # Internal API bridging Convex mutations and Inngest jobs
```

---

## License

Private Repository - All Rights Reserved. Custom development for Forward Deployed client integrations.
