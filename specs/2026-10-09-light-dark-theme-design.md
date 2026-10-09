# Light and Dark Theme Design

## Goal

Let clinic staff choose a light or dark appearance for the application, with their selection remembered across visits. Keep dark mode as the initial appearance for people who have not made a choice.

## Context

The root layout currently adds a permanent `dark` class to `<html>`. The repository already defines light and dark color tokens in `tokens.css`, but the shadcn semantic variables in `app/globals.css` use a separate neutral palette. The clinic logo uses a warm bronze/brown mark on a white background.

## Design

- Add a clearly labeled Light/Dark control to the authenticated sidebar account menu.
- Persist the selected mode in browser storage so it follows the same user across authenticated sessions and reloads. Do not add a theme preference to the database.
- Use dark mode as the fallback when no saved selection exists.
- Make the semantic shadcn variables follow the project color tokens, so existing components using semantic classes change with the selected mode.
- In light mode, use warm bronze/brown from the clinic logo as the primary action/accent color, with white and pale neutral surfaces and dark readable text. Keep feedback colors distinct from the brand accent.
- Preserve the current dark appearance and its existing primary action palette.
- Apply the selected theme consistently to application pages, navigation, forms, tables, dialogs, popovers, and scrollbars. Keep authentication screens legible when the theme changes.
- Respect system reduced-motion preferences if the theme transition uses animation; an immediate color change is acceptable.
- Expose the active mode accessibly to keyboard and assistive-technology users, including a visible focus state.

## Behavior and edge cases

- The control always names the target mode and reflects the current selection.
- A saved selection is applied before the page is visibly rendered where practical, avoiding a light/dark flash on reload.
- If browser storage is unavailable, the app remains usable in the dark default and theme changes apply for the current page session.
- Switching theme does not reload the page or alter application data.

## Out of scope

- A system/automatic theme mode.
- Per-user server-side theme settings or cross-device synchronization.
- Changing the logo artwork.

## Acceptance criteria

1. A user can switch between Light and Dark from the account menu.
2. The selection is retained after reload and navigation.
3. A fresh browser profile starts in dark mode.
4. Light mode uses the logo-inspired bronze accent and readable neutral surfaces and text.
5. Shared semantic UI components remain legible in both modes across the application, including dialogs and authentication forms.
6. Theme switching is keyboard accessible and does not require a page reload.
