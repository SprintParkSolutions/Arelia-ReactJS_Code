export const serviceCategories = {
  residential: {
    label: 'Residential',
    title: 'A home that feels like you.',
    intro: 'From a welcoming living room to a kitchen that makes everyday life easier, we design connected spaces around your routines, taste, and storage needs.',
    image: '/images/ServiceConcepts/residential-living-v1.webp',
    imageAlt: 'Living room with thoughtfully arranged seating and interior finishes',
    spaces: [
      { title: 'Living rooms', image: '/images/ServiceConcepts/residential-living-v1.webp', description: 'Comfortable seating layouts, TV units, lighting, and finishes that bring your family and guests together.', details: 'Furniture layouts / TV units / Layered lighting' },
      { title: 'Kitchens', image: '/images/ServiceConcepts/residential-kitchen-v1.webp', description: 'Practical kitchen layouts with organised storage, considered work surfaces, and finishes suited to everyday cooking.', details: 'Modular cabinetry / Worktops / Storage planning' },
      { title: 'Bedrooms', image: '/images/ServiceConcepts/residential-bedroom-v1.webp', description: 'Restful rooms with wardrobes, bedside lighting, and a balance of comfort and personal style.', details: 'Wardrobes / Bed backdrops / Bedside lighting' },
      { title: 'Dining spaces', image: '/images/ServiceConcepts/residential-dining-v1.webp', description: 'A setting for everyday meals and special gatherings, with coordinated furniture, lighting, and crockery storage.', details: 'Dining layouts / Crockery units / Feature lighting' },
      { title: 'Bathrooms', image: '/images/ServiceConcepts/residential-bathroom-v1.webp', description: 'Well-planned spaces with practical vanities, coordinated surfaces, and thoughtful lighting.', details: 'Vanities / Surface selection / Fixture planning' },
      { title: 'Home offices & study rooms', image: '/images/ServiceConcepts/residential-study-v1.webp', description: 'Dedicated corners for focused work and study, with useful storage and lighting planned around your day.', details: 'Work desks / Shelving / Task lighting' },
    ],
    planning: 'Bring your floor plan, household needs, style references, and an initial budget. We can help you prioritise rooms and plan a cohesive home.',
  },
  commercial: {
    label: 'Commercial',
    title: 'Spaces that work for your business.',
    intro: 'Create a workplace that reflects your identity and supports the people who use it. We bring together practical layouts, welcoming finishes, and room to collaborate.',
    image: '/images/ServiceConcepts/commercial-office-v1.webp',
    imageAlt: 'Office design concept with ergonomic workstations and warm wood finishes',
    spaces: [
      { title: 'Office workspaces', image: '/images/ServiceConcepts/commercial-office-v1.webp', description: 'Efficient workstation layouts with circulation and storage planned around the way your team works.', details: 'Workstations / Team layouts / Storage' },
      { title: 'Reception & waiting areas', image: '/images/ServiceConcepts/commercial-reception-v1.webp', description: 'A welcoming first impression that expresses your business identity and gives visitors a comfortable arrival.', details: 'Reception desks / Visitor seating / Brand finishes' },
      { title: 'Meeting & conference rooms', image: '/images/ServiceConcepts/commercial-meeting-v1.webp', description: 'Spaces for clear conversations, presentations, and collaborative decisions, with furniture and lighting planned together.', details: 'Meeting tables / Lighting / Presentation layouts' },
      { title: 'Executive cabins', image: '/images/ServiceConcepts/commercial-executive-v1.webp', description: 'Private workspaces that balance focused work, small meetings, and a professional presence.', details: 'Desk planning / Guest seating / Custom cabinetry' },
      { title: 'Breakout areas & pantries', image: '/images/ServiceConcepts/commercial-pantry-v1.webp', description: 'Relaxed spaces where teams can take a break, share a meal, and connect away from their desks.', details: 'Casual seating / Pantry storage / Shared tables' },
      { title: 'Showrooms & customer spaces', image: '/images/ServiceConcepts/commercial-showroom-v1.webp', description: 'Customer-facing interiors that organise displays and create a clear, comfortable journey through your business.', details: 'Display planning / Customer circulation / Feature lighting' },
    ],
    planning: 'Share your floor plan, team size, business needs, and expected timeline. We will discuss how the layout can support daily operations and your brand.',
  },
  hospitality: {
    label: 'Hospitality',
    title: 'Make every guest feel welcome.',
    intro: 'From the first impression to the details of a guest room, we design hospitality interiors that balance atmosphere, comfort, and everyday operations.',
    image: '/images/ServiceConcepts/hospitality-suite-v1.webp',
    imageAlt: 'Hospitality suite with warm finishes and a comfortable guest setting',
    spaces: [
      { title: 'Guest rooms & suites', image: '/images/ServiceConcepts/hospitality-suite-v1.webp', description: 'Comfortable rooms with coordinated furniture, lighting, and storage that make a stay feel considered.', details: 'Bed layouts / Wardrobes / Guest lighting' },
      { title: 'Lobbies & reception', image: '/images/ServiceConcepts/hospitality-lobby-v1.webp', description: 'Inviting arrival spaces with a clear reception point, comfortable waiting areas, and a distinct sense of place.', details: 'Reception counters / Lounge seating / Arrival flow' },
      { title: 'Restaurants & dining areas', image: '/images/ServiceConcepts/hospitality-restaurant-v1.webp', description: 'Dining interiors that balance atmosphere with seating arrangements and practical service circulation.', details: 'Seating layouts / Ambient lighting / Service flow' },
      { title: 'Cafes', image: '/images/ServiceConcepts/hospitality-cafe-v1.webp', description: 'Welcoming spaces for a quick visit or a longer conversation, with a thoughtful mix of seating and counter design.', details: 'Service counters / Flexible seating / Material palettes' },
      { title: 'Lounges', image: '/images/ServiceConcepts/hospitality-lounge-v1.webp', description: 'Relaxed gathering spaces with layered lighting, comfortable furniture, and an identity that complements the property.', details: 'Lounge furniture / Feature lighting / Finish selection' },
      { title: 'Banquet & event spaces', image: '/images/ServiceConcepts/hospitality-banquet-v1.webp', description: 'Flexible interiors planned for gatherings, with coordinated finishes and furniture layouts for different occasions.', details: 'Flexible layouts / Decorative finishes / Lighting concepts' },
    ],
    planning: 'Tell us about your property, guest profile, capacity, and operational needs. We can discuss the spaces, materials, and design direction that suit your experience.',
  },
} as const

export type ServiceCategory = keyof typeof serviceCategories
