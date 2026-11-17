# Twin Cities Animal Rescue Website

**A welcoming, accessible web platform connecting rescued animals with adopters, fosters, and volunteers.**

This is the public-facing website for Twin Cities Animal Rescue, a nonprofit organization dedicated to rescuing, rehabilitating, and rehoming animals across the Twin Cities metro area. The site is the organization's digital hub for adoptions, volunteer engagement, foster recruitment, and community connection.

## Features

- **Interactive Pet Finder**: Browse the animals available for adoption with live filtering by species, age, and kid-friendliness
- **Saved Shortlist**: Save favorite animals to a list that is still there on the next visit (browser storage)
- **Interest Form**: Validated in the browser, keeps a draft through a refresh, and is pre-filled from the saved shortlist
- **Multiple Ways to Get Involved**: Clear pathways to adopt, foster, volunteer, or partner with the organization
- **Mission and Impact**: Rescue operations, care standards, and key statistics (animals placed, foster families, volunteer hours)
- **Mobile-First Design**: Responsive layout for phones, tablets, and desktops
- **Accessibility First**: Keyboard navigation, screen reader support, visible focus states, skip link, and semantic HTML, built to WCAG 2.1 AA

## Getting Started

No build tools or dependencies are required. The site runs entirely in the browser.

1. Clone the repository
2. Open `index.html` in a web browser
3. For development, use a local server (for example `python -m http.server 8000`) so local storage and media load properly

## Project Structure

```
Twin-Cities-Animal-Rescue-website/
├── index.html                # Home page: mission, pet finder, impact stats, director's message, featured story
├── services.html             # Adoption process, fostering program, volunteer opportunities
├── about.html                # Organization history, team, partners, values
├── contact.html              # Get Involved interest form
├── css/
│   └── styles.css            # Design tokens, components, and responsive layout
├── js/
│   ├── storage.js            # localStorage wrapper shared by the other scripts
│   ├── pet-finder.js         # Pet data, filtering, and the saved shortlist
│   └── form-validation.js    # Interest form checks, draft saving, shortlist pre-fill
└── media/                    # Logo, photos, and the director's audio and video message
```

## Technology Stack

- **HTML5**: Semantic, accessible markup
- **CSS3**: Mobile-first responsive design with Flexbox and CSS Grid
- **Vanilla JavaScript**: No frameworks or build step
- **Design system**: Deep teal (`#0F4C45`) primary, mint (`#25DAAB`) accent, Poppins for headings, Source Sans 3 for body copy, and a shared spacing scale

## How It Works

### Pet Finder

- **Filters**: species (all, dogs, cats, small pets), age (any, under 1 year, adult, senior), and a "good with children" toggle. Results update instantly.
- **Shortlist**: save or remove animals at any time. The list and the last filter choice are stored in `localStorage`.
- **Data**: animals live in the `PETS` array in `js/pet-finder.js`. A production site would load them from the shelter's database or an API instead.
- **Without JavaScript**: the page shows a phone number to call in place of the finder.

### Interest Form

- Each field has one rule in `VALIDATION_RULES`. Errors appear beside the field and in a summary above the form.
- What has been typed is saved as a draft, so a refresh does not wipe it.
- Animals saved on the home page are named above the form and added to the message.

### Responsive Layout

| Width | Layout |
|---|---|
| 320px and up | Single column, stacked navigation, full-width cards |
| 768px and up | Two columns for content and forms, brand beside navigation, two statistics per row |
| 1024px and up | Four statistics per row, three pet cards per row, media beside text |

## Customization

### Colors, Fonts, and Spacing

All of them are CSS custom properties at the top of `css/styles.css`:

```css
:root {
  --color-primary: #0F4C45;        /* Brand primary */
  --color-accent: #25DAAB;         /* Brand accent */
  --font-heading: "Poppins", ...;  /* Font families */
  --space-md: 1.25rem;             /* Spacing scale */
}
```

### Animals

Edit the `PETS` array in `js/pet-finder.js`:

```javascript
{
  id: 'unique-id',
  name: 'Animal Name',
  species: 'dog',       // 'dog', 'cat', or 'small'
  age: 'adult',         // 'young', 'adult', or 'senior'
  ageLabel: '3 years',  // shown on the card
  goodWithKids: true,
  traits: ['Trait 1', 'Trait 2'],
  summary: 'Brief description of the animal...'
}
```

To change the filter choices, edit the `<select>` options in `index.html` and the matching logic in `getFilteredPets()`.

### Organization Details, Navigation, and Media

- Contact details are in the footer of every page and in the contact section of `index.html`.
- The `<nav>` block is repeated in each HTML file. Keep `aria-current="page"` on the current page's link.
- Media files are in `media/`: `rescue-logo.png`, `rescue-pet.jpg`, `rescue-feature-*.jpg`, and `rescue-message.mp4` with its poster image.

## Accessibility

To check the site after making changes:

- Tab through every page with the keyboard only
- Run the Axe DevTools browser extension
- Test with a screen reader (NVDA, JAWS, or VoiceOver)
- Validate the HTML at validator.w3.org
- Check color contrast for any new text with WebAIM

## Browser Support

Chrome and Edge 90+, Firefox 88+, Safari 14+, and current mobile browsers (iOS Safari, Chrome Mobile).

## Deployment

The site needs only static hosting, with no server-side code or environment variables: Netlify, Vercel, GitHub Pages, Amazon S3 with CloudFront, or any traditional web host.

Before media, the site is about 85 KB: roughly 36 KB of HTML, 23 KB of CSS, and 26 KB of JavaScript. Optimize images before uploading them, and keep the video poster image so the page does not wait on the video.

## Contributing

Contributions are welcome: bug fixes, design improvements, accessibility enhancements, or new features. Feel free to submit issues or pull requests.

- Test responsive design at each breakpoint
- Verify keyboard navigation still works
- Check color contrast for any new text
- Update the design tokens before changing individual components
- Test the pet finder with several filter combinations

## License

This project is open source. Feel free to use, modify, and adapt it for your animal rescue organization.

---

**Help animals in your community find their forever homes with a beautiful, accessible website that works for everyone.**
