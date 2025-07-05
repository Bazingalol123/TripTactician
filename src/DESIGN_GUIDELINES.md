# Travel Buddy Design Guidelines

## 1. Layout & Responsiveness
- Use CSS Grid or Flexbox for all layouts.
- Design mobile-first, then expand for larger screens.
- Use media queries for breakpoints at 1024px, 768px, and 480px.

## 2. Design Tokens
- Use variables from `variables.css` for all colors, spacing, fonts, and radii.
- Never hardcode colors or spacing in component CSS.

## 3. Components
- Each UI element should be a modular, reusable component with its own CSS file.
- Import the CSS file at the top of each component.
- Use BEM or CSS Modules for class naming.

## 4. Accessibility
- All interactive elements must be keyboard accessible.
- Use `aria-label` and roles where needed.
- Ensure color contrast meets WCAG AA standards.
- Use semantic HTML (e.g., `<button>`, `<nav>`, `<main>`, `<section>`).

## 5. Typography
- Use the font families and sizes defined in `variables.css`.
- Maintain a clear hierarchy: headings, subheadings, body, small text.

## 6. Buttons & Forms
- Use primary/secondary/disabled states.
- Add focus and hover states for all buttons and inputs.
- Use accessible labels and error messages.

## 7. Cards & Panels
- Use shadows, rounded corners, and spacing for separation.
- Use consistent padding and margin.

## 8. Map & Data Visuals
- Only show markers for activities/places with valid coordinates.
- Use custom icons/colors for different activity types.
- Info windows should be styled to match the app.

## 9. Print Styles
- Add print media queries to hide navigation, sidebars, and maps.
- Ensure itinerary panels print cleanly.

## 10. Animations
- Use subtle transitions for hover/focus.
- Avoid excessive motion or distracting effects.

## 11. Error & Loading States
- Always show a loading spinner or skeleton for async data.
- Show clear, actionable error messages.

## 12. Testing
- Test all screens on desktop, tablet, and mobile.
- Use browser dev tools to simulate different devices.

---

**For questions or updates, see the README or contact the design lead.** 