# V2 Redesign Scaffold

This folder hosts the redesign effort for the Daily Viva Tracker application. 

The primary goal of this effort is to rebuild and refresh the app's interface and design architecture while keeping the existing legacy code completely untouched and fully functional.

## Folder Structure
- **`pages/`**: Redesigned page views and route entry points.
- **`components/`**: Modular, reusable UI components built specifically for the V2 design system.
- **`theme/`**: Theme tokens, definitions, and utilities (such as dynamic grade color themes).

## Core Design Tokens
- **Ink** (`#1C2B3A`): Headers and primary text.
- **Paper** (`#F7F4EE`): Application backgrounds.
- **Brass** (`#B08942`): Focus accents used sparingly.
- **Grade Colors**: Applied as CSS Custom Properties dynamically at runtime (defaulting to the approved 5-color palette: Excellent, Good, Satisfactory, Improve, Poor).
