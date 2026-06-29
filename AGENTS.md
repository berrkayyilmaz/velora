Velora - Agent Instructions
Project Vision

Velora is an AI-powered fashion discovery, outfit creation, and virtual try-on platform.

The long-term goal is to build a scalable startup that helps users:

Discover fashion products from multiple brands
Create and save outfits
Visualize outfits before purchase
Receive AI-powered styling recommendations
Use virtual try-on technology
Purchase through partner platforms
Current Phase

Current phase is MVP.

Focus only on:

Product discovery
Product catalog
Product detail pages
Outfit builder
Outfit saving
External product redirection

Do NOT implement AI virtual try-on yet.

Development Philosophy

Always prefer:

Simplicity
Clean architecture
MVP-first decisions
Scalability
Type safety
Readability
Small incremental changes

Avoid overengineering.

Tech Stack
Frontend
React Native
Expo
TypeScript
Zustand
React Navigation
Backend
Node.js
Fastify
TypeScript
PostgreSQL
Prisma ORM
Zod
Future AI Layer

Planned but not implemented:

Python
FastAPI
IDM-VTON
MediaPipe

Only create AI-related code when explicitly requested.

Repository Structure

Expected structure:

velora/
├── frontend/
├── backend/
├── docs/
├── AGENTS.md
├── README.md
├── package.json
└── .gitignore

Frontend Rules
Use functional components.
Use TypeScript everywhere.
Keep screens and components separate.
Create reusable components.
Store API calls inside a dedicated service layer.
Never call backend endpoints directly inside UI components.

Preferred structure:

frontend/src/
├── screens/
├── components/
├── navigation/
├── services/
├── store/
├── types/
└── utils/

Backend Rules
Use Fastify.
Use TypeScript.
Use Prisma ORM.
Use Zod validation.
Keep route handlers thin.
Place business logic inside services.
Place database logic inside repositories.

Preferred structure:

backend/src/
├── routes/
├── services/
├── repositories/
├── schemas/
├── config/
├── plugins/
└── types/

MVP Domain Model
Product

Fields:

id
title
brand
category
price
imageUrl
productUrl
sourcePlatform
Outfit

Fields:

id
name
userId
products
User

Fields:

id
email
createdAt
Working Method

Before writing code:

Analyze current project structure.
Explain proposed changes.
Recommend the smallest possible implementation step.
Wait for approval when making major architectural decisions.
Communication Rules

Always:

Explain reasoning.
Suggest MVP-first solutions.
Avoid unnecessary dependencies.
Prefer maintainability over complexity.
Forbidden For MVP

Do not add:

Kubernetes
Elasticsearch
Qdrant
Redis
Payment systems
Checkout systems
AI try-on implementation
AR features

unless explicitly requested.

Current Goal

Build the project foundation:

Backend setup
Frontend setup
Product model
Outfit model
Mock product catalog
Outfit builder MVP

Token Efficiency Rules

- Prefer focused tasks over broad tasks.
- Reuse existing module patterns instead of rereading all documentation.
- Do not summarize full files unless explicitly requested.
- Report only files changed, commands run, errors, and test results.
- Ask before performing large refactors.
- Avoid implementing unrelated features.
