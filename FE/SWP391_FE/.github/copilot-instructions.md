# Project Overview

This is a React application built with Vite. It serves as the front-end for the "EV Co-ownership and Cost-sharing System". The application uses React Router for navigation, Redux for state management, and Axios for API communication.

# Key Architectural Concepts

## Routing and Protected Routes

The main routing is defined in `src/App.jsx`. The application uses a `ProtectedRoute` component located at `src/components/protected-route/index.jsx` to guard routes that require authentication. Currently, the protection logic seems to be commented out, but the structure is in place.

Admin-specific routes are grouped under paths like `/dashboard`, `/manage-account`, etc.

## State Management with Redux

The project uses Redux Toolkit for state management.

- **Store Configuration**: The Redux store is configured in `src/redux/store.js`. It uses `redux-persist` to persist the Redux state to the browser's local storage, ensuring state is not lost on page refresh.
- **Root Reducer**: The `src/redux/rootReducer.jsx` combines different slices of the state.
- **Slices**: State logic is organized into slices. For example, `src/redux/accountSlice.js` manages user account information. When adding new state, create a new slice and add it to the root reducer.

## API Communication

API calls are handled by a pre-configured Axios instance in `src/config/axios.js`. This is where you would typically add interceptors to attach authentication tokens to requests or handle global API errors. When making HTTP requests, you should import and use this Axios instance.

## Component and Page Structure

- **Pages**: Top-level components that correspond to a route are located in `src/pages`. They are organized into subdirectories based on their functionality (e.g., `admin`, `login`, `home`).
- **Components**: Reusable components are placed in `src/components`. For example, the main application layout components like `AppHeader.jsx` and `AppFooter.jsx` are in `src/components/protected-route/layouts`.

## Styling

The project uses a mix of global CSS files and component-specific CSS files.

- Global styles are in `index.css`.
- Component-specific styles are co-located with their components (e.g., `login.css` for the `LoginPage` component).

# Developer Workflow

## Running the Application

- To install dependencies, run: `npm install`
- To start the development server, run: `npm run dev`

## Building for Production

- To create a production build, run: `npm run build`

## Linting

- To run the linter and check for code quality issues, run: `npm run lint`
- The ESLint configuration is in `eslint.config.js`.
