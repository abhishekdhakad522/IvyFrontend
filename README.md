# Ivy Homes - Frontend Assignment

This repository contains the frontend application and data analysis for the Ivy Homes Software Engineering Internship assignment.

## Tech Stack & LLM Usage

As per the rules, I want to be completely transparent about the tools used:
- **Frameworks/Libraries**: React, Vite, React Router, Axios, Recharts, Lucide-React.
- **AI Agents**: The vast majority of the logic, data analysis, and coding was driven using **Antigravity (Google Deepmind's Agentic AI assistant)**. 
- **UI Design**: I used **Lovable** to generate reference layouts and UI inspiration, which was then implemented into the component architecture.

## How to run it

1. Open a terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `frontend` directory with your API key:
   ```env
   VITE_API_URL=https://solve.ivy.homes
   VITE_API_KEY=IVY26-F327DF3C1853
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## How I worked out what to distrust & what I did about it

The API was honest, but the documentation was a minefield. 

1. **Authentication Lies**: The docs claimed the API key should be sent as a query parameter and that no auth was needed for fetching listings. My first request immediately returned a 401 with a helpful error message explicitly telling me to use the `X-API-Key` header and a bearer token. I built an `axios` interceptor to automatically inject these.
2. **Session Lies**: The docs stated tokens were valid for 24 hours. When inspecting the actual login response, it revealed `expires_in: 900` (15 minutes). I implemented a seamless refresh token flow in the axios interceptor to keep the user logged in.
3. **Data Quality & Unit Lies**: The docs claimed all money was in rupees and area in square feet. By scanning the data, I noticed some prices were unusually low (<100k) and areas were tiny (<300). I built a `dataSanitizer` utility to normalize these (e.g., converting square meters to sqft for `magichomes` and thousands to standard rupees for `zerobroker`). I also caught corrupt records where the carpet area was physically larger than the super built-up area.
4. **Fraud**: The docs implied the records were genuine. By grouping listings by contact numbers, I found the exact same phone number masquerading under dozens of different seller names. I updated the sanitizer to block these fake leads.
5. **The Missing Analytics**: The promised `/v1/analytics/summary` endpoint returned a 404. To fulfill the requirement for the Insights dashboard, I built a client-side engine that paginates through all live records, caches them in memory, and crunches the analytics (medians, groupings) dynamically using `recharts`.

## What I checked that turned out to be fine (Failed Hypotheses)

Not every suspicion about the data was correct. Here are a few hypotheses I tested that turned out to be perfectly fine:

1. **Hypothesis: Pagination drops or shuffles records.**
   Given the inconsistencies with the `total` field (reporting 4209 but only returning ~1100), I suspected the pagination logic (`limit`/`offset`) might be skipping records or serving duplicates across pages. I fetched the data using different chunk sizes (limit=50 vs limit=200) and verified the exact same unique properties were returned every time. The pagination is rock solid; only the `total` metadata is wrong.
2. **Hypothesis: `latitude` and `longitude` are randomized or faked.**
   Because so many listings were fake leads, I suspected the geo-coordinates might just be random noise. I extracted the coordinates for several listings and plotted them. They turned out to be highly accurate and clustered properly within the correct localities (e.g., Kukatpally).
3. **Hypothesis: The API Rate Limit (1200/min) triggers prematurely.**
   I suspected the rate limit might be a hidden trap that throttles you earlier than documented. I tested this by spamming concurrent requests while crunching data for the Insights dashboard. The API remained incredibly healthy and didn't drop a single request. 

## What I would do with another two days

1. **Map Integration**: Since I verified the latitude/longitude data is accurate, I would use Mapbox or Google Maps to plot every listing and project on an interactive map. This would drastically improve the Browse and Project detail views.
2. **Backend-for-Frontend (BFF)**: Fetching ~1,100 records client-side for the Insights page works fine for this dataset size, but it doesn't scale. I would spin up a lightweight Node.js/Express server to cache the API responses, sanitize the data, and crunch the analytics server-side, serving a perfectly clean GraphQL or REST endpoint to the React frontend.
3. **Robust State Management**: I would introduce React Query to handle caching, background refetching, and pagination state across the app, eliminating the need to manually manage loading states and `hasMore` logic in every component.
