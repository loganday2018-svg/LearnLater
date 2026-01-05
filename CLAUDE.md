# LearnLater

Personal "save for later" PWA for Logan and Caroline to capture links, notes, watch lists, books, projects, countdowns, and life lessons.

## Tech Stack
- **Frontend**: React 18 + Vite
- **Backend**: Supabase (PostgreSQL + Auth + Edge Functions)
- **Hosting**: Vercel (https://learnlater.vercel.app)
- **PWA**: vite-plugin-pwa with service worker

## Project Structure
```
src/
  App.jsx              # Main app with routing, auth, CRUD operations
  App.css              # All styles (single file)
  supabaseClient.js    # Supabase config
  utils.js             # Helper functions
  components/
    InboxPage.jsx      # Main inbox for links/notes/images
    WatchListPage.jsx  # YouTube videos, movies, TV shows
    BooksPage.jsx      # Reading list with status tracking
    ProjectsPage.jsx   # Projects with categories (personal/work/dad)
    CountdownPage.jsx  # Event countdowns
    TattooRulesPage.jsx # Life lessons/rules to remember
    LibraryPage.jsx    # Folder organization for notes
    SwipeableItemCard.jsx # Main card component with swipe gestures
    EditItem.jsx       # Edit modal for items
    AddItem.jsx        # Add new item modal
    MenuOverlay.jsx    # Hamburger menu
  hooks/
    useUndoDelete.js   # Undo deletion hook
```

## Database Schema (Supabase)
**items** table with type column constraint:
- `link`, `text`, `image`, `checklist` (inbox)
- `movie`, `show`, `youtube` (watch)
- `book`, `project`, `countdown`, `tattoo_rule`

Key columns: id, user_id, type, title, content, url, due_date, recurrence_rule, tags, pinned, watched, sort_order

**folders** table for organizing notes

## Key Features
- Swipe left to delete, swipe right to complete (for items with due dates)
- Recurring tasks with daily/weekly/monthly options
- Drag-and-drop reordering
- PWA with offline support
- Share target (receive shared links from other apps)
- PDF export for watch/book lists

## Commands
```bash
npm run dev      # Local development (localhost:5173)
npm run build    # Production build
vercel --prod    # Deploy to production
```

## Important Notes
- SPA routing configured in vercel.json
- Database constraints managed in Supabase SQL Editor
- To add new item types, update the items_type_check constraint in Supabase
