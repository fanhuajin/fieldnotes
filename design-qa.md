# SoftShelf design QA

final result: passed

## Scope and reference

Reference: Karakeep public demo v0.34.1 at https://try.karakeep.com, plus the user's screenshot of hover selection and the floating bulk-action toolbar. Implementation: http://localhost:4173/ . This is a static GitHub Pages adaptation with the user's content, not a full Karakeep backend or a claim of pixel identity across different content.

Desktop source and implementation screenshots were opened together in one comparison input; mobile List screenshots were also opened together. Desktop capture used a 1440 × 1000 viewport; mobile checks requested 390 × 844. Native screenshot output is used without a simulated phone frame or image rescaling. Device pixel ratio was not overridden or independently measured; no pixel-difference score is claimed.

Evidence directory (local): C:/Users/Administrator/.codex/visualizations/2026/11/05/01a1a92e-0fdd-74a3-8582-34f10808102c/

- Source: karakeep-reference-desktop.png, karakeep-reference-settings.png, karakeep-reference-preview.png, karakeep-reference-mobile-list.png.
- Implementation: softshelf-desktop.png, softshelf-selection.png, softshelf-preview.png, softshelf-mobile.png, softshelf-mobile-list.png.
- The later files named reference-desktop-clean and reference-mobile-clean captured a navigation transition/All Lists; they are not used as Home or mobile comparison evidence.

## Findings and fixes

1. P1, card selection: initial implementation omitted the hover selector and floating action bar shown in the user's reference. Added original icon controls, selected-card treatment, multi-selection, batch favourite/archive/restore/copy/export, select all and clear. The revised softshelf-selection capture visibly includes the selector and toolbar. Batch favourite and archive/restore were exercised in the browser.
2. P2, cover imagery: initial cards enlarged small software icons inside large white covers. At the user's request, retain the software's real icon at a smaller size inside a white tile, centered on a restrained tinted cover. Fixed an initial cascade conflict that left this tile aligned at the top. The revised desktop and mobile captures show centered, proportional icons.
3. P2, metadata typography: increased desktop metadata to the source's 16px scale; smaller mobile List metadata prevents overflow alongside actions.
4. P2, direct preview routes: initial direct entry could leave the underlying page unrendered. Render the base resource page before reading a preview route. Reloading a direct JMeter preview was tested with all 20 resources still rendered behind the dialog.

No unresolved P0/P1/P2 finding within the approved static adaptation scope.

## Required fidelity surfaces

- Typography: original Inter font files and original CSS utilities; source-sized 14px navigation, 18px card titles and 12px tags. Original SVG logo graphic with SoftShelf text replacing the source wordmark. Chinese content uses the platform font fallback.
- Spacing/layout: source 64px header, responsive sidebar, 16px content/card gaps, native card radii and borders. Desktop column layout and mobile List/image alignment were compared; no horizontal page overflow or missing image was observed in the mobile check.
- Color/tokens: original Karakeep foreground, background, muted, border and accent variables. Light/dark switching and source-like popovers work. Pastel cover colors are an explicitly requested content-image adaptation.
- Images/icons: original logo path and original Lucide paths; original local software images retain proportions. No enlarged photo substitute, hotlinked demo imagery, or fabricated brand graphic. Focused inspection of the header, selectors, cards, toolbar and mobile rows supplemented the full-frame comparison.
- Copy/content: SoftShelf brand and actual download metadata replace demo content. All fields in all 11 original software records were compared against the previous Git revision and preserved. Eight existing official website URLs and the actual repository form the Bookmarks and Projects lists. Interface controls use English.

## Interaction verification

Browser verified: search and empty results; Software/Bookmarks/Projects counts; Masonry/Grid/List/Compact; Show Notes and Show Tags; image-fit menu selection; light/dark theme selection; preview and unchanged download href; direct preview reload; mobile list navigation; selection toolbar; batch favourites, archive and restore; clearing selection. No captured browser console error was reported during these checks.

Automated checks verified: JS syntax; every original software field; collection filtering; multi-term search paths; tag counts; newest ordering; favourites/archive/highlights filters; invalid duplicate IDs; local image/font paths. No test-only file is retained.

Clipboard writing and the browser export download were implemented but were not exercised end to end in this QA run. Download packages were not downloaded or installed again.

## Expected differences and boundaries

- Demo banner, server-backed item creation, account management, AI processing and destructive server deletion are omitted for the agreed static deployment. No non-working backend controls are presented.
- The toolbar keeps applicable static actions; it does not modify the repository's source JSON. Favourites/archive/view preferences live in the current browser only.
- Card images and metadata represent software packages rather than the demo's article photos and publication dates. Covers intentionally differ following the user's latest request.
- The default order follows static configuration; Newest First reverses it rather than inventing publication timestamps.

## Completion checks

- Original CSS/font/icon assets and licenses included; obsolete Homer runtime removed.
- Canonical static configuration and maintenance instructions documented.
- Desktop/mobile captures reviewed after the cover and selection fixes.
- No remaining blocking visual finding; backend parity is outside the agreed scope.
