# GTCR Indexer

A high-performance blockchain indexer for Kleros Generalized Token Curated Registries (GTCR). This indexer tracks and indexes all GTCR-related events across multiple networks, providing a comprehensive GraphQL API for querying registry data, items, requests, disputes, and evidence.

## Overview

The GTCR Indexer monitors and indexes events from Kleros GTCR contracts, including both classic GeneralizedTCR and LightGeneralizedTCR implementations. It provides real-time indexing of:

- **Registry Management**: Factory deployments and registry configurations
- **Item Lifecycle**: Submissions, status changes, and metadata
- **Dispute Resolution**: Arbitration processes, appeals, and rulings
- **Evidence Handling**: IPFS-based evidence submission and retrieval
- **Financial Tracking**: Deposits, contributions, and reward distributions

## Features

- 🚀 **Multi-chain Support**: Ethereum Mainnet, Gnosis Chain, and Sepolia testnet
- 📊 **Real-time Indexing**: Live event processing with sub-second latency
- 🔍 **Rich GraphQL API**: Comprehensive querying capabilities with relationships
- 📁 **IPFS Integration**: Automatic metadata and evidence fetching from IPFS
- 🏗️ **Type Safety**: Full TypeScript implementation with generated types
- 🔄 **Unordered Multichain**: Efficient cross-chain event processing
- 📈 **Performance Optimized**: Built for high-throughput blockchain data

## Supported Networks

| Network          | Chain ID | Start Block | Contracts                     |
| ---------------- | -------- | ----------- | ----------------------------- |
| Ethereum Mainnet | 1        | 10,247,117  | GTCRFactory, LightGTCRFactory |
| Gnosis Chain     | 100      | 16,969,180  | GTCRFactory, LightGTCRFactory |
| Sepolia Testnet  | 11155111 | 4,048,282   | GTCRFactory, LightGTCRFactory |

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/en/download/current) (v18 or newer)
- [pnpm](https://pnpm.io/installation) (v8 or newer)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/kleros/gtcr-indexer.git
   cd gtcr-indexer
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and configure:

   ```env
   ENVIO_API_TOKEN="your-envio-api-token"
   ENVIO_GNOSIS_RPC_URL="https://rpc.gnosis.gateway.fm"
   ENVIO_MAINNET_RPC_URL="https://eth-mainnet.g.alchemy.com/v2/your-key"
   ENVIO_SEPOLIA_RPC_URL="https://eth-sepolia.g.alchemy.com/v2/your-key"
   ```

4. **Generate code from schema**

   ```bash
   pnpm codegen
   ```

5. **Start the indexer**

   ```bash
   pnpm dev
   ```

6. **Access GraphQL Playground**

   Visit [http://localhost:8080](http://localhost:8080) (password: `testing`)

## Architecture

### Contract Types

The indexer supports two main GTCR implementations:

#### Classic GTCR (`GeneralizedTCR`)

- Full-featured registry with comprehensive dispute resolution
- Supports complex appeal mechanisms and contribution tracking
- Used for high-stakes registries requiring maximum security

#### Light GTCR (`LightGeneralizedTCR`)

- Streamlined implementation with reduced gas costs
- Simplified dispute resolution process
- Optimized for frequent interactions and lower-value items

### Data Model

The indexer maintains a comprehensive data model including:

- **Registries**: GTCR contract instances with metadata
- **Items**: Individual entries in registries with status tracking
- **Requests**: Status change requests (registration/removal)
- **Disputes**: Arbitration cases with round-based appeals
- **Evidence**: IPFS-linked evidence submissions
- **Contributions**: Financial contributions to dispute sides

### Event Processing

The indexer processes the following key events:

| Event              | Description             | Contracts         |
| ------------------ | ----------------------- | ----------------- |
| `NewGTCR`          | New registry deployment | Factory contracts |
| `ItemStatusChange` | Item status updates     | GTCR contracts    |
| `Evidence`         | Evidence submission     | GTCR contracts    |
| `Dispute`          | Dispute creation        | GTCR contracts    |
| `Ruling`           | Arbitrator decisions    | GTCR contracts    |
| `Contribution`     | Appeal contributions    | GTCR contracts    |

## GraphQL API

### Example Queries

#### Get all registries

```graphql
query GetRegistries {
  Registry {
    id
    numberOfItems
    connectedTCR
    registrationMetaEvidence {
      uri
    }
  }
}
```

#### Get items in a registry

```graphql
query GetItems($registryId: String!) {
  Item(where: { registry_id: { _eq: $registryId } }) {
    id
    itemID
    status
    disputed
    latestRequester
    numberOfRequests
  }
}
```

#### Get evidence for a dispute

```graphql
query GetEvidence($evidenceGroupId: String!) {
  EvidenceGroup_by_pk(id: $evidenceGroupId) {
    evidences {
      id
      party
      uri
      title
      description
      timestamp
    }
  }
}
```

#### Get dispute information

```graphql
query GetDispute($itemId: String!) {
  Item_by_pk(id: $itemId) {
    requests {
      disputed
      disputeOutcome
      rounds {
        ruling
        amountPaidRequester
        amountPaidChallenger
        appealed
      }
    }
  }
}
```

## Development

### Project Structure

```
src/
├── constants/           # Chain configurations and constants
├── mappings/           # Event handlers organized by contract
│   ├── GTCRFactoryMappings/     # Factory contract handlers
│   ├── GTCRMappings/            # Classic GTCR handlers
│   ├── LightGTCRFactoryMappings/ # Light factory handlers
│   ├── LightGTCRMappings/       # Light GTCR handlers
│   └── helpers/                 # Shared mapping utilities
└── utils/              # Utility functions
    ├── contract/       # Contract interaction utilities
    └── ipfs/          # IPFS data fetching
```

### Available Scripts

```bash
# Development
pnpm dev              # Start development server with hot reload
pnpm start            # Start production server
pnpm stop             # Stop the indexer

# Code Generation
pnpm codegen          # Generate types from schema and config

# Building
pnpm build            # Compile TypeScript
pnpm clean            # Clean build artifacts

# Testing
pnpm test             # Run test suite
pnpm mocha            # Run mocha tests directly
```

### Adding New Event Handlers

1. **Define the event in `config.yaml`**

   ```yaml
   events:
     - event: YourEvent(address indexed param1, uint256 param2)
   ```

2. **Create the handler file**

   ```typescript
   // src/mappings/YourContract/YourEvent.ts
   import { YourContract } from "generated";

   YourContract.YourEvent.handler(async ({ event, context }) => {
     // Handle the event
   });
   ```

3. **Export the handler**

   ```typescript
   // src/mappings/YourContract/index.ts
   import "./YourEvent";
   ```

4. **Regenerate types**
   ```bash
   pnpm codegen
   ```

### IPFS Integration

The indexer automatically fetches and parses metadata from IPFS:

- **Registry Metadata**: Title, description, item naming
- **Evidence Data**: Evidence files with titles and descriptions
- **Item Data**: Structured item information based on registry schema

IPFS fetching is handled through Envio's effect system with automatic caching and error handling.

## Configuration

### Environment Variables

| Variable                | Description                   | Required |
| ----------------------- | ----------------------------- | -------- |
| `ENVIO_API_TOKEN`       | Envio platform API token      | Yes      |
| `ENVIO_GNOSIS_RPC_URL`  | Gnosis Chain RPC endpoint     | Yes      |
| `ENVIO_MAINNET_RPC_URL` | Ethereum Mainnet RPC endpoint | Yes      |
| `ENVIO_SEPOLIA_RPC_URL` | Sepolia testnet RPC endpoint  | Yes      |
| `ENVIO_KLEROS_CDN_LINK` | Kleros CDN for metadata       | Yes      |

### Network Configuration

Networks are configured in `config.yaml` with specific contract addresses and start blocks. The indexer uses `unordered_multichain_mode` for efficient cross-chain processing.

## Deployment

### Production Deployment

1. **Set up environment variables**

   ```bash
   export ENVIO_API_TOKEN="your-production-token"
   export ENVIO_GNOSIS_RPC_URL="your-production-rpc"
   # ... other variables
   ```

2. **Build the project**

   ```bash
   pnpm build
   ```

3. **Start the indexer**
   ```bash
   pnpm start
   ```

## Contributing

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes**
4. **Add tests if applicable**
5. **Submit a pull request**

### Code Style

- Use TypeScript for all new code
- Follow existing naming conventions
- Add JSDoc comments for public functions
- Ensure type safety throughout

## Resources

- [Envio Documentation](https://docs.envio.dev)
- [Kleros GTCR Documentation](https://kleros.gitbook.io/docs/products/curate)
- [GTCR Contract Repository](https://github.com/kleros/tcr)

## Support

For questions and support:

- [GitHub Issues](https://github.com/kleros/gtcr-indexer/issues)
- [Kleros Discord](https://discord.gg/MhXQGCyHd9)
- [Envio Discord](https://discord.gg/envio)
