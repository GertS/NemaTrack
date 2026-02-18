# NemaTrack MVP

NemaTrack is een Next.js MVP voor het beheren en visualiseren van laboratoriumuitslagen (aaltjes/nematoden) die als PDF binnenkomen.

## Stack
- Next.js 14 (TypeScript, App Router)
- Prisma ORM
- SQLite (development)
- Recharts voor trendgrafieken
- `pdf-parse` voor server-side PDF tekstextractie
- Vitest voor parser unit tests

## Features (MVP)
- `/fields`: CRUD-light voor canonieke fields + field aliases
- `/upload`: upload PDF, parser review, handmatige koppeling naar canoniek field
- `/field/[id]`: tijdreeksvisualisatie per analyte + meetpuntentabel
- `/documents/[id]`: documentdetails + extracted JSON
- Best effort parser die ontbrekende velden tolereert en warnings geeft
- Fallback demo data wanneer PDF extractie mislukt

## Installatie
```bash
npm install
```

## Database setup
```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run seed
```

## Start development
```bash
npm run dev
```
Open: http://localhost:3000

## Testen
```bash
npm run test
```

## Parser aanpak
- Stap 1: PDF -> text via `pdf-parse`
- Stap 2: line normalization + regex matching voor:
  - `Monsternummer`
  - `Perceel`
  - `Datum ontvangst`
  - `Datum verslag`
  - tabelregels met `aaltjessoort + waarde`
  - optioneel cysteaaltjesblok (`cysten`, `lle`, `besmettingsgraad`)
- Stap 3: opslaan in `Document.extractedJson` + gestructureerde records (Sample/Measurement/CystResult)

## Opmerkingen
- De parser is expres "best effort" en crasht niet op missende velden.
- Je kunt parser iteratief verbeteren terwijl de ruwe output al opgeslagen wordt.
