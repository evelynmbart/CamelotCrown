# Canter

A web implementation of Camelot, a medieval-themed strategy board game created in 1930. Think chess meets checkers with knights that can chain jumps.

[Play it here](https://cantercrown.com) | [Rules](lib/camelot/README.md)

## What is Camelot?

Camelot is a two-player abstract strategy game played on a 160-square board. Each player controls 14 pieces (10 Men and 4 Knights) and tries to move two pieces into the opponent's Castle.

The game features:

- **Plain moves**: One square in any direction
- **Canters**: Leaping over friendly pieces
- **Jumps**: Mandatory captures by leaping over enemy pieces
- **Knight's Charge**: Knights can combine canters and jumps in a single move

## Features

- Play locally or against a computer
- Real-time multiplayer with Supabase
- ELO rating system
- AI opponent using alpha-beta pruning
- Full rule implementation including castle mechanics

## Tech

Next.js 15, TypeScript, Supabase, Tailwind CSS

## Running Locally

```bash
pnpm install
cp .env.local.example .env.local
supabase start
pnpm dev
```

Requires Docker for local Supabase.

## Why?

Camelot was commercially successful in the mid-20th century but fell into obscurity after its manufacturer went out of business. The game has interesting mechanics that blend positional play with tactical combinations. This is an attempt to make it accessible again.

## License

MIT
