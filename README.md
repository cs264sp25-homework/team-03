# TabAssist

TabAssist is a Chrome extension that helps you manage and interact with your browser tabs using AI. It allows you to extract and analyze content from your open tabs and engage in AI-powered conversations about the content.

## Features

- **Tab Management**: View and search all your open tabs in one place
- **Content Extraction**: Extract and analyze text from any webpage
- **AI Chat**: Ask questions about your tab content using AI
- **Tab Groups**: Organize tabs into collections for better management
- **Message Editing**: Edit and regenerate AI responses in conversations
- **Dark Mode Support**: Full dark mode support for better viewing experience

## Installation Guide

TabAssist is currently available as a local development version. Follow these comprehensive steps to set it up:

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download Node.js](https://nodejs.org/)
- **npm** or **pnpm** package manager - pnpm is recommended and can be installed with `npm install -g pnpm`
- **Git** - [Download Git](https://git-scm.com/downloads)
- **Google Chrome** browser - [Download Chrome](https://www.google.com/chrome/)

### Step 1: Clone the Repository

```shell
# Clone the repository
git clone https://github.com/cs264sp25-homework/team-03

# Navigate to the project directory
cd team-03
```

### Step 2: Install Dependencies

```shell
# Using pnpm (recommended)
pnpm install

# OR using npm with legacy peer deps flag to resolve dependency conflicts
npm install --legacy-peer-deps
```

### Step 3: Set Up Environment Variables (if needed)

If the project requires environment variables:

1. Create a `.env` file in the root directory
2. Add any required environment variables (check for a `.env.example` file)

### Step 4: Start the Convex Backend

TabAssist uses Convex for its backend services. Start the Convex development server:

```shell
npx convex dev
```

This command will start the Convex backend server, which handles data storage, retrieval, and real-time updates. Keep this terminal window open while using the extension.

### Step 5: Build the Chrome Extension

In a new terminal window, build the extension:

```shell
npm run build
```

This command compiles the TypeScript code and creates a production-ready build in the `build` directory.

### Step 6: Load the Extension in Chrome

1. Open Google Chrome
2. Navigate to `chrome://extensions/` in the address bar
3. Enable **Developer mode** by toggling the switch in the top-right corner
4. Click the **Load unpacked** button that appears
5. Browse to and select the `build` folder from your project directory
6. The TabAssist extension should now appear in your extensions list

### Step 7: Verify Installation

1. Look for the TabAssist icon in your Chrome toolbar (top-right corner)
2. If you don't see it, click the puzzle piece icon to see all extensions and pin TabAssist
3. Click the TabAssist icon to open the extension popup
4. You should see a list of your open tabs and the extension interface

## Using TabAssist

Once installed, here's how to use the main features of TabAssist:

### Basic Usage

1. **View All Tabs**: When you open TabAssist, you'll see a list of all your open tabs
2. **Search Tabs**: Use the search bar at the top to filter tabs by title or URL
3. **Switch to a Tab**: Click on any tab in the list to switch to it in your browser
4. **Extract Content**: Click the **Extract** button on any tab to analyze its content
5. **View Extracted Text**: The extracted text will appear in a modal window

### Tab Groups

1. **Create Groups**: Select tabs and click "Create Group" to organize them
2. **Add to Groups**: Add tabs to existing groups using the "Add To" button
3. **Manage Groups**: View, edit, and delete groups in the Collections tab
4. **Automatic Content Extraction**: Tab content is automatically extracted when added to groups

### Using AI Chat

1. Click the **Chat** tab at the top of the extension
2. Type your question about tab content in the message input
3. The AI will respond based on the content of your tabs
4. **Edit Messages**: Click the edit button to modify your messages
5. **Regenerate Responses**: Use the regenerate button to get a new AI response

## Development Workflow

For developers who want to modify or enhance TabAssist, follow these steps:

### Making Changes

1. **Frontend Changes**:
   - Edit files in the `src` directory
   - Key components are in `src/components`
   - UI components use shadcn/ui for consistent styling

2. **Backend Changes**:
   - Edit files in the `convex` directory
   - Database schema is in `convex/schema.ts`
   - API endpoints are in files like `convex/tabs.ts`, `convex/chats.ts`, etc.

3. **Extension Configuration**:
   - The manifest file is at `public/manifest.json`
   - Background scripts are in `public/background.js` and `src/background.ts`

### Development Server

For faster UI development, you can run the development server:

```shell
npm run dev
```

This starts a local server with hot reloading. Note that while this is useful for UI development, you'll still need to build and reload the extension to test it in Chrome.

### Building and Testing

After making changes:

1. Build the extension:
   ```shell
   npm run build
   ```

2. Update the extension in Chrome:
   - Go to `chrome://extensions/`
   - Find TabAssist in the list
   - Click the refresh icon ↻ on the extension card
   - Or toggle the extension off and on

3. Test your changes by clicking the TabAssist icon in Chrome

### Debugging

- **Extension Popup**: Right-click on the extension popup and select **Inspect** to open DevTools
- **Background Script**: Click **background page** in the extension details to view background script logs
- **Console Logs**: Add `console.log()` statements to debug specific components or functions

## Technical Details

### Architecture

TabAssist uses a dual backend architecture:

1. **Convex Backend** (`/convex` directory):
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
- Tab Groups

### Project Structure
- `src/` - Frontend React application
  - `components/` - React components
  - `hooks/` - Custom React hooks
  - `lib/` - Utility functions
- `convex/` - Backend Convex functions
- `public/` - Static assets and extension manifest
- `build/` - Production build output

### Code Style
- Follow TypeScript best practices
- Use ESLint for code linting
- Use Prettier for code formatting
- Use shadcn/ui for consistent UI components

## Recent Updates

- Added tab group management features
- Implemented message editing and regeneration
- Added dark mode support
- Improved error handling and user feedback
- Enhanced UI components with shadcn/ui
- Added automatic content extraction for tab groups

## Licensing

Refer to the [Project Repository License](./LICENSE.md) for information on how the project is licensed.