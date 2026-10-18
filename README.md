# Surveyer

Surveyer is a web-based survey builder for collecting and analyzing responses, with a focus on surveys tied to places in Bangladesh. It combines a manual survey editor, AI-assisted drafting, Bangladesh administrative-area targeting, optional respondent geolocation, and geographic reporting.

## What makes it different

Many survey products are designed as general-purpose form builders. Surveyer's distinguishing focus is connecting a survey to a place and making the resulting field responses easier to interpret:

- **Bangladesh-first location targeting:** Choose a target area through the administrative hierarchy of division, district, upazila, and union.
- **Optional location-aware collection:** A survey can require the respondent's browser location. When an area is selected, the server checks submitted coordinates against an approximate radius around that area's stored coordinates.
- **Geographic reporting:** View response locations on a map, with marker and heatmap modes, alongside question summaries and cross-tab analysis.
- **AI-assisted survey drafts:** Describe the survey you need and generate a starting point with questions and answer options. Generated content can be reviewed and edited in the builder.
- **Flexible question setup:** Build surveys manually with supported text, long-text, number, single-choice, multiple-choice, and date questions, plus required fields and validation rules.

### How it compares

This is a product-positioning comparison, not a feature-by-feature audit. Google Forms, SurveyMonkey, KoboToolbox, and similar platforms have their own overlapping features, integrations, and plans; their capabilities and pricing can change.

| Product category | Typical emphasis | Surveyer's focus |
| --- | --- | --- |
| General-purpose form and survey tools (for example, Google Forms or SurveyMonkey) | Creating and sharing forms for a broad range of use cases | Built-in Bangladesh administrative-area selection and location-aware survey collection |
| Field-research platforms (for example, KoboToolbox) | Field data collection and research workflows | A focused web survey builder with respondent-location checks and map-based response reporting |

Surveyer is a focused project, not a claim of feature parity with these mature platforms. In particular, confirm that its location checks, reporting, and deployment setup meet your research requirements before using it for operational or sensitive data collection.

## Tech stack

- [Next.js](https://nextjs.org/) App Router and React
- MySQL-compatible database, accessed through Sequelize
- [Groq](https://groq.com/) API for AI survey generation (optional)
- Leaflet and OpenStreetMap tiles for response maps

## Run locally

### Prerequisites

- Node.js and npm
- A MySQL database with the schema and geographic reference data expected by the application
- A Groq API key only if you want to use AI survey generation

### Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and set the values for your environment:

   ```env
   NODE_ENV=development

   DB_HOST=127.0.0.1
   DB_USER=root
   DB_PASS=your_database_password
   DB_NAME=survey_app

   JWT_SECRET=replace_with_a_long_random_secret
   JWT_EXPIRED_IN=3d

   GROQ_API_KEY=your_groq_api_key
   ```

   `GROQ_API_KEY` is only needed for AI generation. Keep `.env.local` and production secrets out of version control.

3. Prepare the database before starting the app. The project uses Sequelize models but does not automatically create or seed the complete database schema on startup. Configure the MySQL connection and load the Bangladesh geographic reference data required by your deployment.

4. Start the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

### Production build

```bash
npm run build
npm start
```

Set production environment variables on the hosting provider, use a persistent MySQL-compatible database, and use a strong, private `JWT_SECRET`. The connection currently hardcodes MySQL and does not read `DB_PORT` or `DB_DIALECT`; it uses the MySQL driver's default port, 3306. A managed database requiring another port or additional TLS options will need corresponding connection configuration in the application.

## Important location notes

- Respondent geolocation requires the respondent's permission and is generally available only in secure browser contexts, such as HTTPS.
- The selected administrative area is checked using a distance radius around its stored coordinates; this is an approximate location check, not an official boundary polygon or proof of a respondent's identity.
- A survey that does not require geolocation can still collect responses without browser location access.

## Project status

Surveyer is an actively developed application. Before relying on it for production research, review the authentication, data-retention, privacy, database backup, and access-control requirements for your use case. The application stores response content and may store respondent coordinates and request metadata; disclose and handle that data appropriately.
