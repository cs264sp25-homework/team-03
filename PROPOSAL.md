# TabAssist: Context-Aware AI Bookmark Assistant

## Project Overview
TabAssist is an intelligent AI-powered assistant that enhances how users interact with their saved web pages. By analyzing the content of bookmarked sites, it provides a conversational interface that synthesizes information, answers questions, and connects insights across multiple sources. This tool streamlines research, shopping, and information management, making it easier to extract value from saved content.

## Functional Requirements

### General Features
- Web-based interface for managing bookmarks
- User authentication to store personalized bookmarks
- Ability to add and organize bookmarks by categories or tags
- Extract and process content from saved bookmarks
- Provide a chat interface for user interactions

### AI Features
- Maintain crawled context in memory in the chat
- Answer questions based on bookmarked page content
- Generate quick summaries of saved bookmarks
- Identify key topics and themes across multiple bookmarks
- Extract and compare specifications from different bookmarks
- Generate a citation list from saved research papers or articles
- Highlight relevant sections across bookmarks in AI responses

### Optional Features (if time permits)
- Recrawl bookmarked pages for real-time content updates
- Support different AI models per user preference
- Use content embedding to shorten the context necessary for answering queries
- Search across saved bookmarks semantically
- Compare and contrast content from different sources
- Highlight relevant information from specific bookmarks
- Implement regeneration of AI responses with adjusted temperature

### Nice-to-have Features (won't be implemented)
- Quick summary view of all saved bookmarks
- Ability to selectively include bookmarks in AI context
- Save and export conversations
- Integration with browser bookmarking system
- Support for PDF and image content extraction
- Image recognition and analysis from bookmarked pages
- Automatic bookmark organization suggestions

## Tech Stack

### Frontend
- React for UI components
- TailwindCSS and Shadcn UI for styling

### Backend
- OpenAI API for AI features
- Convex for conversation storage
- WebSocket server for real-time updates
- Web scraping tools (e.g., Puppeteer, BeautifulSoup) for extracting page content

### Development Tools
- Vite for development
- ESLint for code quality
- Jest for testing

## Project Roadmap

This roadmap outlines the development of TabAssist across two sprints:
- **Sprint 1**: Weeks 8, 10, 11 (March 10 - April 4)
- **Sprint 2**: Weeks 12 - 14 (April 7 - April 25)
- **Final deliverable due**: Monday, April 28

### Sprint 1: March 10 - April 4

#### Week 8 (March 10-14): Project Setup & Core Infrastructure
**Tasks:**
- Set up project repository with React, Vite, TailwindCSS, and Shadcn UI
  - Create project structure and configure build tools
  - Set up code linting and formatting with ESLint
  - Configure deployment pipeline
- Design and implement database schema
  - Design schema for users, bookmarks, and conversations
  - Set up Convex database configuration
  - Create data models and relationships
  - Implement real-time synchronization for conversations
- Develop UI component library
  - Build reusable UI components (buttons, cards, inputs, etc.)
  - Create sidebar layout components
  - Implement responsive design for sidebar

**Deliverables:**
- Project repository with CI/CD setup
- Basic UI component library
- Database schema documentation

#### Week 10 (March 24-28): User Authentication & Web Scraping
**Tasks:**
- Implement user authentication system
  - Integrate GitHub OAuth with Convex
  - Create sign-up/sign-in flows
  - Set up secure token handling
  - Create user profile data structure
- Develop web scraping functionality
  - Implement content extraction from active tab
  - Create HTML parsing and cleaning logic
  - Add text extraction and preprocessing
  - Implement error handling for different site types
- Build bookmark management system
  - Create bookmark saving interface
  - Implement CRUD operations for bookmarks
  - Add validation and error handling
  - Develop categorization and tagging system

**Deliverables:**
- Complete authentication system
- Working web scraper for single-tab content extraction
- Basic bookmark management functionality
- User profile management system

#### Week 11 (March 31-April 5): AI Integration & Chat Interface + Sprint 1 Wrap-up
**Tasks:**
- Implement OpenAI API integration
  - Set up API connection and configuration
  - Create service layer for AI interactions
  - Implement error handling and rate limiting
  - Design prompt engineering system
- Develop context management system
  - Create content preprocessing for AI context
  - Implement context window management
  - Build context optimization algorithms
  - Add metadata extraction for content
- Build chat interface
  - Create message thread component
  - Implement user input handling
  - Design AI response rendering
  - Add chat history persistence
- Sprint 1 wrap-up
  - Conduct thorough testing of all implemented features
  - Fix critical bugs and issues
  - Deploy Sprint 1 milestone for demonstration

**Deliverables:**
- Functioning AI integration with OpenAI
- Context management system for bookmark content
- Interactive chat interface
- Basic conversation persistence
- Sprint 1 progress report and working demo
- Presentation of Sprint 1 accomplishments

### Sprint 2: April 8 - April 25

#### Week 12 (April 8-12): Multi-Bookmark Support & Core AI Features
**Tasks:**
- Implement multi-bookmark crawling functionality
  - Create bookmark selection interface
  - Build batch processing for multiple bookmarks
  - Implement content merging strategies
  - Add progress indicators for crawling
- Develop syncing between bookmarks
  - Create message history synchronization
  - Implement context sharing across bookmarks
  - Build real-time updates using WebSocket
  - Add conflict resolution strategies
- Implement core AI features
  - Develop question answering based on bookmark content
  - Create bookmark summarization functionality
  - Implement key topic/theme identification
  - Build citation generation for research content

**Deliverables:**
- Complete multi-bookmark crawling functionality
- Bookmark synchronization system
- Complete core AI features

#### Week 13 (April 15-19): Bookmark Organization
**Tasks:**
- Enhance bookmark organization
  - Create advanced categorization system
  - Implement tag-based filtering and search
  - Build visual organization interface
  - Add batch operations for bookmarks
- Begin development of specification extraction
  - Design recognition patterns for product spec (e.g., methodology, results, citations)
  - Create comparison templates (defining categories to compare across multiple sources)
  - Implement data extraction from structured content
  - Build display components for comparisons (side-by-side tables or visual formats)

**Deliverables:**
- Enhanced bookmark organization system
- Initial specification extraction functionality
- Improved user experience for content management

#### Week 14 (April 22-25): Advanced Content Analysis & Optional Features
**Tasks:**
- Start implementing optional features (if time permits)
  - Develop recrawling functionality for content updates
  - Create AI model selection interface
  - Begin implementing content embedding for context optimization
  - Add semantic search capabilities
- Chrome extension integration
- Complete optional features implementation
  - Finalize recrawling functionality
  - Complete AI model selection system
  - Finalize content embedding implementation
  - Complete semantic search functionality
- Implement custom context support
  - Create interface for manual context addition
  - Build text processing for custom context
  - Implement context merging with scraped content
  - Add persistence for custom context
- Conduct comprehensive testing and quality assurance
  - Perform usability testing with representative users
  - Identify and fix bugs and issues
  - Optimize performance and responsiveness
  - Ensure security of user data
- Final deployment and project wrap-up
  - Deploy final extension version
  - Verify all features are working in production
  - Create presentation materials
  - Prepare for project demonstration

**Deliverables:**
- Initial implementation of optional features
- Enhanced content analysis capabilities
- Polished, production-ready Bookmark App
- Complete implementation of all planned features
- Comprehensive documentation
- Presentation materials for project demonstration

## Key Milestones
- March 14: Project infrastructure complete with basic extension scaffold
- March 28: Authentication and web scraping functionality implemented
- April 5: AI integration and chat interface functionality + Sprint 1 completion
- April 12: Multi-bookmark support & Core AI features
- April 19: Advanced AI features and bookmark organization complete
- April 25: Application finalized with optional features and comprehensive testing
- April 28: Final project submission and demonstration