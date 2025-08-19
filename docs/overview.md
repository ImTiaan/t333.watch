# t333.watch — Comprehensive Strategy & PRD

---

## 1. Background & Market Context

### 1.1 The Twitch Ecosystem
Twitch is the dominant live-streaming platform for gaming, esports, IRL, and roleplay.  
It has a highly engaged audience who often watch streams for hours at a time.  
However, Twitch is still built around the **single-stream model**: one channel per tab.  
This works for solo creators but **fails for multi-perspective genres** like:

- **Roleplay (RP)**: GTA V RP and other story-driven servers, where multiple characters’ perspectives matter.  
- **Esports**: Matches where every player POV is streamed separately alongside the caster feed.  
- **IRL & Events**: Conventions, concerts, festivals with multiple cameras.  
- **Collaborations**: When 3–6 streamers are playing the same game or hosting a co-op show.  

Today, Twitch viewers solve this by:  
- Opening multiple browser tabs.  
- Using barebones tools like MultiTwitch or Multistream.  
- Watching highlights after the fact.  

None of these solutions provide **a polished, Twitch-native feeling experience.**

---

### 1.2 Existing Solutions and Their Gaps

**MultiTwitch / Multistream**  
- Strength: lightweight, free, URL-based.  
- Weakness: no login, no personalization, no discovery, clunky UX, no sync.  

**Twitch Native**  
- Strength: polished, reliable, trusted.  
- Weakness: limited to one stream at a time. No multi-POV.  

**Discord watch parties**  
- Strength: social.  
- Weakness: poor sync, no proper embedding, not scalable for public events.  

**Esports tools**  
- Strength: tailored for specific games.  
- Weakness: not general-purpose, only for official tournaments.  

**Conclusion**:  
There’s an unfilled gap between **Twitch’s polish** and **MultiTwitch’s functionality.**  
t333.watch is designed to occupy that gap — a product Twitch *should* have built.  

---

### 1.3 Timing & Opportunity

- **Cultural demand**: RP servers, esports finals, and Twitch collabs are bigger than ever.  
- **Behavioral demand**: Users already hack solutions (tabs, MultiTwitch) → proof of need.  
- **Monetization potential**: Twitch doesn’t charge for this; MultiTwitch can’t. This leaves space for a freemium SaaS.  
- **Tech readiness**: Twitch’s APIs, embeds, and Stripe’s global availability make this feasible now.  

---

## 2. Vision & Mission

### 2.1 Vision
To become the **default way viewers experience multi-perspective live and recorded content**.  
In the same way playlists changed music consumption, **Packs will change live video consumption.**

---

### 2.2 Mission
- Deliver a polished, Twitch-native multi-viewer.  
- Empower users to save, share, and discover stream Packs.  
- Unlock premium features that enhance viewing (unlimited streams, VOD sync, notifications).  
- Expand beyond Twitch to become a **universal live content layer** across platforms.  

---

### 2.3 Positioning Statement
*"t333.watch is what happens when Twitch gets superpowers. It feels native, but lets you watch multiple perspectives — live or in sync — with Packs you can save, share, and discover."*  

---

## 3. Target Audience & Personas

### 3.1 Audience Segments
1. **Casual Viewers** → want to watch 2–3 friends at once.  
2. **Superfans** → follow big esports events or RP servers, want all POVs.  
3. **Streamers** → want to curate and share Packs with their audience.  
4. **Community Organizers** → RP server admins, esports orgs, event hosts.  

---

### 3.2 Detailed Personas

**Persona 1: The Casual Viewer (Ellie, 22, UK)**  
- Watches GTA RP casually, follows 15–20 streamers.  
- Frustration: “I always have to pick one POV, but I know I’m missing things.”  
- Goal: Seamlessly watch 2–3 streams at once without juggling tabs.  
- Success: She can log in with Twitch, click 3 of her followed channels, and view them in a single grid.  

**Persona 2: The Superfan (Marcus, 27, USA)**  
- Esports fan, follows Valorant tournaments religiously.  
- Frustration: Official streams don’t let him watch player POVs together.  
- Goal: Sync multiple VODs to relive matches.  
- Success: Uses synced playback to follow entire matches across POVs.  

**Persona 3: The Streamer (Luna, 30, Canada)**  
- Mid-sized GTA RP streamer with 200 average viewers.  
- Frustration: Her fans ask, “Who else is in this scene?” and she has to link others manually.  
- Goal: Create a Pack with her + friends’ POVs.  
- Success: Shares a Pack link in her chat via `!pack`, fans can instantly join.  

**Persona 4: The Community Organizer (Andrei, 34, Germany)**  
- Runs a large RP server with 50+ active streamers.  
- Frustration: Viewers constantly ask “Who should I watch?”  
- Goal: Provide curated Packs of the most relevant POVs.  
- Success: Publishes official Packs during big events. Fans discover more creators.  

---

### 3.3 Why These Personas Matter
- **Casual viewers** → drive volume.  
- **Superfans** → push premium conversions.  
- **Streamers** → distribute Packs, fueling virality.  
- **Organizers** → formalize partnerships, opening monetization opportunities.  

---
## 4. Differentiation & Competitive Edge

### 4.1 Competitive Landscape

**Twitch (native)**
- Strengths: Polished UX, trusted, stable.  
- Weaknesses: Limited to single POV. No multi-view.  

**MultiTwitch / Multistream**
- Strengths: Lightweight, free, URL-based.  
- Weaknesses: Feels outdated, lacks login, no personalization, no discovery, poor mobile UX, no sync.  

**Esports-specific Tools**
- Strengths: Deep integration for certain games.  
- Weaknesses: Not general-purpose, only work for official tournaments.  

**Discord Watch Parties**
- Strengths: Social and group-oriented.  
- Weaknesses: Bad sync, poor video quality, not scalable for large audiences.  

---

### 4.2 t333.watch Differentiation

- **Twitch-native UX** → Feels like Twitch, not a hack. Dark theme, purple accents, similar controls.  
- **Packs = Playlists** → Stream groups that can be saved, shared, discovered. A social object.  
- **Synced VOD Playback** → Unique differentiator. Replay events like you’re controlling the timeline.  
- **Freemium Model** → Natural paywall (4th stream, personalization, sync).  
- **Social Discovery** → Trending Packs, topic filters, follow/remix mechanics.  

---

### 4.3 Strategic Edge

- **UX polish**: Competing tools feel clunky; we mirror Twitch’s design language.  
- **Discovery**: MultiTwitch only works if you know what you want; t333.watch helps you *find* it.  
- **VOD sync**: A future-facing, technically hard differentiator.  
- **Virality**: Packs spread in chats, Discords, social media — like Twitch clips.  

---

## 5. Design Philosophy

### 5.1 Guiding Principles
- **Feels like Twitch**: UI should look and behave like a natural extension of Twitch, not a foreign site.  
- **Zero friction**: Fast load, one-click login, instant stream playback.  
- **Scalable layouts**: Grid auto-adjusts up to 9 streams (premium); mobile defaults to PiP/split-screen.  
- **Accessibility**: Keyboard navigation, screen reader support, WCAG 2.1 compliance.  
- **Clarity > Novelty**: Borrow familiar patterns (Twitch layout, YouTube scrubbing) rather than inventing.  

---

### 5.2 Visual Design
- **Color palette**: Twitch purple (#9146FF), dark gray background, white text, accent colors sparingly.  
- **Typography**: Sans-serif similar to Twitch’s Roobert font (fallback: Inter).  
- **Layout**:  
  - Top nav (packs, discover, profile).  
  - Content grid with cards (like Twitch categories).  
  - Consistent hover states, focus rings, and skeleton loaders.  

---

### 5.3 Interaction Design
- **Audio control**: Always one active audio, hover to unmute switch.  
- **Hover actions**: Add/remove from Pack, expand player, view tags.  
- **Save/share**: Pack actions surfaced in top-right of grid.  
- **Upgrade flow**: Locks blurred behind translucent overlay with “Upgrade to unlock.”  

---

## 6. Detailed MVP Features

### 6.1 Authentication
- **Twitch OAuth** login.  
- Pull user’s followed channels to auto-suggest when creating Packs.  
- Store user profile in DB (id, name, premium status).  

---

### 6.2 Multi-Stream Viewer (Core Grid)
- Free tier: 3 simultaneous Twitch streams.  
- Premium: unlimited (up to 9 recommended).  
- Grid auto-scales based on number of streams.  
- Example: 2 streams = split screen, 3 streams = 3-column, 6 streams = 2x3 grid.  

---

### 6.3 Packs (Stream Groups)
- Pack = saved collection of Twitch channels.  
- Packs have: title, description, tags, streams, owner.  
- Visibility: public or private.  
- Example: “NoPixel Heist Pack” with 5 streamers’ POVs.  

---

### 6.4 Discovery
- Tab: “Trending Packs.”  
- Sorted by recent views and shares.  
- Cards show: title, tags, owner, thumbnails of streams.  
- Example: A Valorant finals Pack trending during event day.  

---

### 6.5 Monetization
- Free: 3 streams, can view public packs but not save.  
- Premium ($5–7/mo): unlimited streams, save/clone packs, VOD sync, notifications.  
- Stripe checkout with customer portal.  
- Upgrade triggers:  
  - Adding 4th stream.  
  - Clicking “save pack.”  

---

### 6.6 Audio Control
- Only one active audio at a time.  
- Clicking another stream auto-mutes others.  
- Optional “follow audio to mouse” (experimental).  

---

## 7. Phase 2+ Features

### 7.1 Synced VOD Playback
- Core differentiator.  
- Global scrubber controls all VODs.  
- Per-channel offset adjustments (seconds).  
- Premium-only.  
- Example: Sync RP police POV with criminal POV.  

---

### 7.2 Deep Links
- Packs support timestamped links (`/pack/abc?t=5m30s`).  
- Clicking opens Pack and syncs timeline.  
- Example: Share exact moment of RP chase across multiple POVs.  

---

### 7.3 Clone & Follow Packs
- **Clone**: Copy a Pack into your library and modify.  
- **Follow**: Subscribe to updates when the original creator changes it.  
- Premium-only.  
- Example: Clone “Esports Finals” pack, add player POVs, share remix.  

---

### 7.4 Notifications
- In-app alerts: “Pack you follow is live.”  
- Future: Email or push (mobile app).  
- Example: Get notified when a Pack of streamers you follow goes live together.  

---

### 7.5 Extended Discovery
- Packs categorized by tags (Esports, RP, Music, IRL, TTRPG).  
- Trending algorithm = views + saves + shares.  
- Example: Browse IRL Packs during TwitchCon weekend.  

---

### 7.6 Mobile Optimizations
- Split-screen up to 2 streams.  
- Swipe to switch Pack streams.  
- Premium unlocks PiP with multiple floating players.  

---
## 8. UX & UI Details

The design goal is to feel **like a native extension of Twitch**. Users shouldn’t feel like they’ve left the Twitch ecosystem. Layouts, colors, and interaction patterns should mirror what viewers already know.

---

### 8.1 Layouts

**Login Page**
- Centered logo + “Login with Twitch” button (purple).  
- Dark background, Twitch-style gradient.  
- Footer disclaimer: “t333.watch is not affiliated with Twitch.”  

**Dashboard**
- Top nav:  
  - My Packs  
  - Discover  
  - + New Pack  
  - Profile dropdown (settings, billing, logout).  
- Main area: Pack cards in grid (similar to Twitch category cards).  
- Each card shows: title, owner, tags, preview thumbnails.  
- Hover actions: Open, Clone (premium), Share.  

**Pack Editor**
- Fields: Title, Description, Tags, Visibility.  
- Add Twitch channel input (with autocomplete from followed channels).  
- Reorderable list of streams.  
- “Save Pack” CTA → gated behind premium.  

**Multi-Stream Viewer (Live)**
- Grid layout that auto-scales (2 streams = split, 4 = 2x2, etc).  
- Player overlays:  
  - Stream title  
  - Owner avatar (small)  
  - Mute/unmute icon  
  - “Remove from Pack” (x)  
- One active audio at a time (click switches).  

**Multi-Stream Viewer (VOD)**
- Same grid layout as live.  
- Global scrubber below grid.  
- Per-stream offset sliders (±30s adjustments).  
- Time displayed in unified HH:MM:SS format.  

**Discovery Page**
- Tabs: Trending | New | Rising.  
- Pack cards sorted by algorithm.  
- Search bar for tags/streams.  
- Example: Type “NoPixel” → see RP packs trending.  

**Upgrade Flow**
- Modal overlay when user hits feature limit.  
- Blurred locked feature + CTA: “Upgrade to Premium to unlock unlimited streams, Pack saving, and more.”  
- CTA → Stripe checkout.  

---

### 8.2 Interaction Rules

- **Stream Add/Remove**: Smooth animation when adding/removing from grid.  
- **Audio Switching**: Always clear which stream is active (highlighted border + speaker icon).  
- **Hover States**: Cards lift slightly, show action buttons.  
- **Errors**:  
  - Invalid channel = red inline error.  
  - Expired VOD = “Unavailable” overlay.  
- **Empty States**:  
  - Dashboard: “No packs yet. Create one or explore Discover.”  
  - Discovery: “No packs found. Try another tag.”  

---

### 8.3 Accessibility

- Keyboard navigation: Tab through players, space to toggle mute.  
- Contrast ratios: WCAG 2.1 AA minimum.  
- Screen reader support: Pack cards and players have descriptive labels.  

---

## 9. Technical Architecture

---

### 9.1 Frontend

- **Framework**: Next.js (React).  
- **Styling**: Tailwind CSS for consistency with Twitch-like design.  
- **Video**: Twitch Embed IFrame API for players.  
- **State Management**: React Query (for API calls, caching).  
- **Auth**: Twitch OAuth, handled via NextAuth or custom.  

---

### 9.2 Backend

- **Framework**: Node.js + Express/Fastify.  
- **DB**: Supabase (Postgres) for relational data.  
- **Cache**: Redis (Upstash) for fast Twitch API caching (channels, streams).  
- **Payments**: Stripe Checkout + Customer Portal.  
- **Notifications**: Webhooks + DB queue.  

---

### 9.3 Database Schema

**Users**
- id (UUID)  
- twitch_id (string)  
- display_name (string)  
- premium_flag (boolean)  
- stripe_customer_id (string)  
- created_at, updated_at  

**Packs**
- id (UUID)  
- owner_id (FK → users.id)  
- title (string)  
- description (text)  
- tags (array/text)  
- visibility (enum: public/private)  
- created_at, updated_at  

**Pack_Streams**
- id (UUID)  
- pack_id (FK → packs.id)  
- twitch_channel (string)  
- order (int)  
- offset_seconds (int, default 0)  

**Notifications**
- id (UUID)  
- user_id (FK → users.id)  
- event_type (enum: pack_live, trending)  
- payload (JSON)  
- created_at  

---

### 9.4 Hosting & Infrastructure

- **Frontend**: Vercel (auto-deploy from GitHub).  
- **Backend**: Fly.io or Render (scalable).  
- **DB**: Supabase Cloud.  
- **Cache**: Upstash Redis.  
- **Monitoring**: Sentry (errors), UptimeRobot (availability).  
- **CI/CD**: GitHub Actions (tests + deploys).  

---

### 9.5 API Integrations

- **Twitch Helix API**: Channels, streams, VODs.  
- **Twitch OAuth**: User login and channel follows.  
- **Stripe API**: Payments and subscription status.  

---

## 10. Risks & Mitigations

---

### 10.1 Twitch Platform Risk
- **Risk**: Twitch changes embed rules or API quotas.  
- **Mitigation**:  
  - Use official Twitch Embed IFrame API.  
  - Cache aggressively with Redis.  
  - Fallback to showing error overlays.  

---

### 10.2 Performance & Scaling
- **Risk**: Loading multiple streams overwhelms client or server.  
- **Mitigation**:  
  - Limit free to 3 streams.  
  - Warn users above 6 streams (performance).  
  - Lazy load offscreen players.  

---

### 10.3 Sync Drift (VODs)
- **Risk**: VODs lose sync over time.  
- **Mitigation**:  
  - Force periodic re-sync to global scrubber.  
  - Display drift warning if offset > 1s.  

---

### 10.4 Abuse & Moderation
- **Risk**: Packs with offensive names/tags.  
- **Mitigation**:  
  - Profanity filter on Pack titles.  
  - Report system with escalation to human review.  

---

### 10.5 Billing & Payment Failures
- **Risk**: Stripe webhook downtime → missed updates.  
- **Mitigation**:  
  - Webhook retry logic.  
  - Grace period for expired subscriptions.  
  - Admin dashboard to resolve disputes.  

---

### 10.6 Competition
- **Risk**: Twitch or others launch similar feature.  
- **Mitigation**:  
  - Move faster (social + sync + Packs).  
  - Build viral loops Twitch won’t.  
  - Differentiate on UX polish.  

---
## 11. Metrics & Success Criteria

---

### 11.1 Business KPIs
- **Monthly Active Users (MAU)** → growth of user base.  
- **Session Duration** → average time spent per session.  
- **Session Frequency** → how often users return.  
- **Retention**: Day-1, Day-7, Day-30.  
- **Conversion Rate**: Free → Premium (goal: 5–8%).  
- **ARPU**: Average revenue per premium subscriber.  
- **Churn**: Percentage of premium cancellations per month.  

---

### 11.2 Technical KPIs
- **Player load success**: > 98% of streams must load.  
- **API latency**: < 200ms (p95).  
- **VOD sync accuracy**: drift < 0.5s.  
- **Cache hit rate**: > 80%.  
- **Uptime SLA**: 99.9% target.  

---

### 11.3 North Star Metric
**Average session duration per active user**  
If users are spending more time per session, it means Packs are sticky, multi-viewing is compelling, and discovery works.  

---

## 12. Growth Strategy

---

### 12.1 Viral Loops
- **Pack Sharing**: Every Pack has a unique link → spreads in Twitch chat, Discord, Twitter.  
- **Streamer Integration**: Streamers share Pack links via `!pack` bot command.  
- **Discovery**: Packs become the social object, like playlists on Spotify.  

---

### 12.2 Initial GTM Focus
- **Phase 1: Roleplay (GTA V, RDR2)**  
  - Strongest use case: multi-POV storytelling.  
  - RP fans are already accustomed to tab juggling.  

- **Phase 2: Esports (Valorant, LoL, CS2)**  
  - Superfans want synced VOD replays.  
  - Packs let fans watch players + casters together.  

- **Phase 3: IRL + Music**  
  - IRL festivals, TwitchCon, concerts.  
  - Multi-cam Packs showcase the format beyond gaming.  

- **Phase 4: TTRPG (D&D, Critical Role-style)**  
  - Multi-POV campaigns where every player streams.  

---

### 12.3 Retention Levers
- Notifications when Packs go live.  
- Personalized discovery feed (“Packs like yours”).  
- Premium unlocks: saves, sync, unlimited streams.  

---

### 12.4 Monetization Strategy
- **Freemium**: 3 free streams per session.  
- **Premium ($5–7/month)**:  
  - Unlimited streams.  
  - Pack saving/cloning.  
  - Synced VOD playback.  
  - Notifications.  
- **Future**:  
  - Verified Creator Packs (streamers monetize Pack links).  
  - Sponsored Packs (brands during esports events).  

---

## 13. Ops & Resourcing (Mega-Lean)

---

### 13.1 Human Roles
- **Operator (COO/PM)**: Defines roadmap, monitors KPIs, manages ops. ~5–10 hrs/week.  
- **AI-assisted DevOps/Engineer**: Oversees infra, merges AI-generated PRs, handles edge cases. ~5 hrs/week.  

---

### 13.2 Automated Functions
- **Codegen**: AI generates features via PRD-to-code pipelines.  
- **Hosting**: Vercel (FE), Fly.io/Render (BE), Supabase (DB).  
- **Monitoring**: Sentry (errors), UptimeRobot (uptime).  
- **Billing**: Stripe Checkout + Customer Portal.  
- **Support**: Discord bot + simple ticketing.  
- **Moderation**: Profanity filter + report queue.  

---

### 13.3 Cost Model
- Infra costs: $75–150/mo.  
- Break-even: ~20–30 premium subs.  
- Scalability: Linear infra cost growth, but strong economies of scale with caching.  

---

### 13.4 Weekly Ops Routine
- Monday: Review usage + KPIs.  
- Mid-week: Approve AI PRs, deploy minor fixes.  
- Friday: Push marketing (Discord/Reddit posts).  
- As needed: Handle Stripe billing disputes or flagged content.  

---

## 14. Future-Proofing & Extensions

---

### 14.1 Cross-Platform Expansion
- Add **YouTube Live**, **Kick**, and **custom RTMP feeds**.  
- Pack = universal container of streams, not Twitch-only.  

---

### 14.2 AI Auto-Sync
- **Audio fingerprinting** → auto-align streams in VOD playback.  
- **Scene change detection** → smart jump-to moments.  
- **AI Highlights** → auto-generate multi-POV highlight reels.  

---

### 14.3 Creator Monetization
- **Verified Packs**: Creators can publish official Packs and earn from Premium referrals.  
- **Tips & Subscriptions**: Fans can tip Pack curators directly.  
- **Sponsored Packs**: Esports orgs/brands promote Packs during events.  

---

### 14.4 Social Graph
- **Follow Packs**: Stay updated when they change or go live.  
- **Remix Packs**: Clone and personalize existing Packs.  
- **Collaborative Packs**: Multiple curators edit together.  
- **Discovery Hubs**: Browse Packs by category (Esports, RP, IRL, Music, TTRPG).  

---

### 14.5 Event Mode
- Special Pack layouts for **big events** (e.g., esports finals, TwitchCon, music festivals).  
- Featured on homepage with spotlight UI.  
- Example: “League Worlds Finals Pack” with caster POV + 5 player POVs.  

---

### 14.6 VR/AR & Long-Term Vision
- **VR Mode**: Immersive multi-screen theater where Packs surround you.  
- **AR Mode**: Overlay multiple streams in real-world space.  
- **Long-Term Vision**:  
  - Packs become to video what playlists are to music.  
  - t333.watch evolves into the **Spotify for live content**.  
  - Users discover, share, and monetize multi-perspective experiences across platforms.  

---
