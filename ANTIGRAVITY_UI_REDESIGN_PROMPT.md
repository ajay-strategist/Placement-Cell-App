# Antigravity Prompt — UI/UX Redesign (keep theme, polish components)

> Paste everything below into Antigravity.

---

## ROLE
You are a senior UI/UX engineer. Refine the **visual design only** of an existing web app called **Christ Placement Cell**. Do NOT change features, logic, data flow, IDs, or class names — only how things look.

## CONTEXT — the app (do not break it)
- **Stack:** plain HTML + CSS + vanilla JS. Backend is Google Apps Script + Google Sheets (don't touch it).
- **Pages:** `index.html` (login), `admin.html`, `student.html`, `teacher.html`, `coordinator.html`, `manage-training.html`.
- **Styling:** one shared stylesheet `css/style.css`. Theme = navy sidebar, royal-blue accent, **Inter** font, white cards. Key class names already in use: `glass-card`, `btn` / `btn-primary` / `btn-secondary` / `btn-danger` / `btn-success` / `btn-sm`, `btn-icon` / `coord-badge`, `form-control` / `form-label`, `table`, `badge` / `status-pill` (`status-qualified|pending|dropped`), `sidebar` / `sidebar-link`, `stat-card` / `dash-chart-card` / `dash-kpi-card`, `management-tab` / `tab` / `tab-content`, `modal-content`, `login-tab`.

## HARD RULES
1. **Keep the current theme** — same color identity (navy `#0b1220`/`#111c31` sidebar, blue accent `#1d4ed8`/`#2563eb`, success green, danger red), Inter font, rounded cards. Refine, don't reinvent.
2. **Do all styling in `css/style.css`.** Prefer improving existing class rules and CSS variables. Do NOT add a CSS framework, new font, or new color scheme. Only add minimal new CSS that matches the system.
3. **Do not rename classes or IDs, change HTML structure, remove elements, or alter any JavaScript.** Inline `style="..."` attributes may be lightly cleaned up to use existing classes/variables, but only when it can't change behavior.
4. The app must look and work identically in flow after your changes — every button, table, modal, tab, and form still functions.

## WHAT TO IMPROVE (priority order)
1. **Buttons (most important — currently inconsistent/unpolished).** Create a single, cohesive button system:
   - Consistent height, padding, radius, font-weight, and icon+label gap across `.btn-primary/.btn-secondary/.btn-danger/.btn-success/.btn-sm`.
   - Clear visual hierarchy: primary = filled accent (subtle gradient ok), secondary = outline/neutral, danger/success = semantic fills.
   - Proper interaction states: `:hover` (slight lift + shadow), `:active` (press), `:focus-visible` (accessible focus ring), and a `disabled` style.
   - Polished **icon buttons** for table row actions (view/edit/key/delete) — equal square size, aligned, hover tint; the delete stays clearly red.
2. **Forms & inputs** — consistent field height/radius, clear focus ring, readable labels, aligned filter rows (no stray right-floating controls).
3. **Cards** — unify radius, border, and shadow across `glass-card`, `stat-card`, `dash-chart-card`; subtle hover elevation for interactive cards. Soften any heavy/neumorphic shadows.
4. **Tables** — clean header style, comfortable row padding, hover row highlight, consistent badge/pill rendering.
5. **Tabs** — clear active state and hover for `.tab` / `.management-tab` / `.login-tab`.
6. **Sidebar** — refined active state (solid accent pill), good spacing, hover feedback.
7. **Modals** — consistent header, padding, rounded corners, soft entrance animation, scroll for tall content.
8. **Badges / status pills** — one consistent set (coordinator badge, registration status, present/absent, completed).
9. **Spacing & rhythm** — consistent gaps and section spacing; reduce visual clutter.
10. **Responsive** — sidebar and content collapse gracefully on narrow screens; tables scroll instead of breaking.
11. **Accessibility** — sufficient contrast, visible focus states, don't rely on color alone.

## DESIGN DIRECTION
- Modern, clean, professional SaaS dashboard feel. Generous whitespace, soft shadows, ~10–14px radii, calm and consistent.
- Use CSS variables for the palette, radii, and shadows so the system stays consistent and easy to tweak.
- Subtle micro-interactions only (hover lift, focus ring, gentle fade) — nothing flashy.

## DELIVERY
- Make changes primarily in `css/style.css`.
- After finishing, give me: (a) a short summary of what changed, (b) the list of components restyled, and (c) confirmation that no HTML structure, IDs, class names, or JS were altered.
- Verify each page (login, admin, student, teacher, coordinator, manage-training) still renders and every button/modal/tab works.
