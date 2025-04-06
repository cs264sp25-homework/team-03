# TabAssist

TabAssist is a Chrome extension that helps you manage and interact with your browser tabs using AI. It allows you to extract and analyze content from your open tabs, and engage in AI-powered conversations about the content.

## Installing / Getting started

To get started with TabAssist, follow these steps:

1. Clone the repository:
```shell
git clone https://github.com/cs264sp25-homework/team-03
cd team-03
```

2. Install dependencies:
```shell
pnpm install
```

3. Start the Convex backend:
```shell
npx convex dev
```

4. Build the Chrome extension:
```shell
npm run build
```

5. Load the extension in Chrome:
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner
   - Click "Load unpacked"
   - Select the `build` folder from your project directory

The extension should now be installed and ready to use in your Chrome browser.

## Developing

To set up the development environment:

1. Install Node.js (v16 or higher) and npm
2. Install the project dependencies:
```shell
pnpm install
```

3. Start the Convex backend:
```shell
npx convex dev
```

4. Build and test changes:
   - After making changes, run:
   ```shell
   npm run build
   ```
   - Reload the extension in Chrome to see your changes

### Database
The application uses Convex as its backend database. Convex provides:
- Real-time data synchronization
- Automatic schema validation
- Built-in authentication
- Serverless functions
- Type-safe database queries

The database schema is defined in the `convex/schema.ts` file and includes tables for:
- Users
- Chats
- Messages
- Tab content

### Project Structure
- `src/` - Frontend React application
- `convex/` - Backend Convex functions
- `public/` - Static assets and extension manifest
- `build/` - Production build output

### Code Style
- Follow TypeScript best practices
- Use ESLint for code linting
- Use Prettier for code formatting

## Licensing

Refer to the [Project Repository License](./LICENSE.md) for information on how the project is licensed.