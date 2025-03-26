# TabAssist: Context-Aware AI Bookmark Assistant

## Project Overview
TabAssist is an AI-powered Chrome extension that enhances how users interact with their open browser tabs. By analyzing the content of active tabs, it provides a conversational interface that synthesizes information, answers questions, and connects insights across multiple sources. This tool streamlines research, and information management, making it easier to extract value from open web pages in real-time.

## Functional Requirements

### General Features
- Chrome extension interface for managing open tabs  
- Ability to retrieve tabs from a certain tabgroup using a unique ID  
- User authentication to store personalized bookmarks  
- Instead of auth, we will generate a random hash key for each chat session to maintain context (this is what Prof and we talked about after class today)  
- Extract and process content from active and grouped tabs  
- Provide a chat interface for user interactions  

### Optional Features (if time permits)
- Utilize anonymous authentication from Convex for session management  
- Recrawl tabs for real-time content updates  
- Support different AI models per user preference  
- Use content embedding to optimize context for answering queries  

### Nice-to-have Features (won't be implemented)
- Quick summary view of all open tabs  
- Ability to selectively include tabs in AI context  
- Save and export conversations  
- Integration with Chrome’s built-in tab management  
- Support for PDF and image content extraction  

## AI Features
- Maintain crawled context in memory in the chat  
- Answer questions based on open tab content  
- Generate quick summaries of tab content  
- Identify key topics and themes across multiple tabs  
- Extract and compare specifications from different sources  
- Generate a citation list from research articles or reports  
- Highlight relevant sections across tabs in AI responses  

### Optional Features (if time permits)
- Search across saved tabs semantically  
- Compare and contrast content from different sources  
- Highlight relevant information from specific tabs  
- Implement regeneration of AI responses with adjusted temperature  

### Nice-to-have Features (won't be implemented)
- Image recognition and analysis from tab content  
- Automatic tab organization suggestions  

## Tech Stack

### Frontend
- Chrome Extension (Manifest V3)  
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

### Core Infrastructure
- Set up basic Chrome extension structure  
- Create a basic sidebar UI  
- Implement scraper logic for a single tab  

### AI Integration
- Implement OpenAI API integration  
- Develop a context management system  
- Create a basic chat interface  

### Multi-Tab Features
- Crawl information from multiple tabs  
- Add to model context when new windows open  
- Sync message history across tabs in a window  

---

## Project Roadmap

This roadmap outlines the development of TabAssist across two sprints:

**Sprint 1: Weeks 8, 10, 11 (March 10 - April 4)**  
**Sprint 2: Weeks 12 - 14 (April 7 - April 25)**  
**Final deliverable due: Monday, April 28**

### Sprint 1: March 10 - April 4

#### Week 8 (March 10-14): Project Setup & Core Infrastructure

**Tasks:**
- Set up project repository with Chrome Extension framework, React, Vite, TailwindCSS, and Shadcn UI  
- Create project structure and configure build tools  
- Set up code linting and formatting with ESLint  
- Configure deployment pipeline  
- Design and implement database schema in Convex  
- Design schema for chat sessions and extracted tab content  
- Create data models and relationships  
- Implement real-time synchronization for conversations  

**Develop UI component library:**
- Build reusable UI components (buttons, cards, inputs, etc.)  
- Create sidebar layout components  
- Implement responsive design for sidebar  

**Deliverables:**
- Project repository with CI/CD setup  
- Basic UI component library  
- Database schema documentation  

#### Week 10 (March 24-28): Tab Retrieval & Web Scraping

**Tasks:**
- Implement tab retrieval system  
- Use Convex random hash or anonymous authentication for session handling  
- Retrieve tabs from tab groups  
- Implement tab selection UI  
- Manage tab session data within Convex  

**Develop web scraping functionality:**
- Implement content extraction from active tabs  
- Create HTML parsing and cleaning logic  
- Add text extraction and preprocessing  
- Implement error handling for different site types  

**Deliverables:**
- Functional tab retrieval system (Henry)  
- Working web scraper for extracting tab content (Jacob)  
- Tab session management with user & tab group isolation (Ashley)  

#### Week 11 (March 31-April 5): AI Integration & Chat Interface + Sprint 1 wrap-up

**Tasks:**
- Implement OpenAI API integration  
- Set up API connection and configuration  
- Create service layer for AI interactions  
- Implement error handling and rate limiting  

**Design prompt engineering system:**
- Develop context management system  
- Create content preprocessing for AI context  
- Implement context window management  
- Build context optimization algorithms  
- Add metadata extraction for content  

**Build chat interface:**
- Create message thread component  
- Implement user input handling  
- Design AI response rendering  
- Add chat history persistence  

**Sprint 1 wrap-up:**
- Conduct thorough testing of all implemented features  
- Fix critical bugs and issues  
- Deploy Sprint 1 milestone for demonstration  

**Deliverables:**
- Functioning AI integration with OpenAI  
- Context management system for tab content  
- Interactive chat interface  
- Basic conversation persistence  
- Sprint 1 progress report and working demo  
- Presentation of Sprint 1 accomplishments  

---

### Sprint 2: April 8 - April 25

#### Week 12 (April 8-12): Multi-Tab Support & Core AI Features

**Tasks:**
- Implement multi-tab crawling functionality  
- Create tab selection interface  
- Build batch processing for multiple tabs  
- Implement content merging strategies  
- Add progress indicators for crawling  

**Develop syncing between tabs:**
- Create message history synchronization  
- Implement context sharing across tabs  
- Build real-time updates using WebSocket  
- Add conflict resolution strategies  

**Implement core AI features:**
- Develop question answering based on tab content  
- Create tab summarization functionality  
- Implement key topic/theme identification  
- Build citation generation for research content  

**Deliverables:**
- Complete multi-tab crawling functionality  
- Tab synchronization system  
- Complete core AI features  

#### Week 13 (April 15-19): Advanced Tab Organization

**Tasks:**
- Enhance tab organization  
- Implement advanced categorization system  
- Develop tag-based filtering and search  
- Build visual organization interface  
- Add batch operations for tabs  

**Begin development of specification extraction:**
- Design recognition patterns for structured data (e.g., methodology, results, citations)  
- Implement data extraction and display components  
- Create comparison templates  

**Deliverables:**
- Enhanced tab organization system  
- Initial specification extraction functionality  

#### Week 14 (April 22-25): Advanced Content Analysis & Optional Features

**Tasks:**
- Implement optional features (if time permits)  
- Develop recrawling functionality for content updates  
- Create AI model selection interface  
- Begin implementing content embedding for context optimization  
- Add semantic search capabilities  

**Chrome extension finalization:**
- Conduct comprehensive testing and quality assurance  
- Perform usability testing with representative users  
- Identify and fix bugs and issues  
- Optimize performance and responsiveness  
- Ensure security of user data  

**Final deployment and project wrap-up:**
- Deploy final extension version  
- Verify all features are working in production  
- Create presentation materials  

**Deliverables:**
- Initial implementation of optional features  
- Enhanced content analysis capabilities  
- Polished, production-ready extension  
- Complete implementation of all planned features  
- Comprehensive documentation  
- Presentation materials for project demonstration  

---

## Key Milestones

- March 21: Project infrastructure complete with basic extension scaffold  
- March 28: Tab retrieval system and web scraping functionality implemented  
- April 5: AI integration and chat interface functionality + Sprint 1 completion  
- April 12: Multi-tab support & Core AI features  
- April 19: Advanced AI features and tab organization complete  
- April 25: Application finalized with optional features and comprehensive testing  
- April 28: Final project submission and demonstration  
