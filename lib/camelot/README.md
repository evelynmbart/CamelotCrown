# Camelot Rules

## Basic Setup

**Players**: Two players, White and Black. White moves first.

**Pieces**: Each player starts with 14 pieces:
- 4 Knights
- 10 Men

**Starting Positions**:
- White Knights: C6, D7, I7, J6
- White Men: D6, E6, E7, F6, F7, G6, G7, H6, H7, I6
- Black Knights: C11, D10, I10, J11
- Black Men: D11, E10, E11, F10, F11, G10, G11, H10, H11, I11

**Castles**:
- White's Castle: F1, G1
- Black's Castle: F16, G16

## Movement Types

### 1. Plain Move
Move one square in any direction (horizontal, vertical, or diagonal) to an adjacent empty square.

**Notation**: `C8-D9`

### 2. Canter
Leap over a **friendly piece** on an adjacent square, landing on the empty square immediately beyond it in a straight line.

**Key Rules**:
- Pieces cantered over are NOT removed
- Can canter multiple times in one move
- Can change direction after each canter
- Cannot start and end on the same square
- Never required to canter
- Never required to canter as far as possible

**Notation**: `E6-C8-A8` (cantered from E6 to C8 to A8)

### 3. Jump
Leap over an **enemy piece** on an adjacent square, landing on the empty square immediately beyond it in a straight line.

**Key Rules**:
- Jumped pieces ARE captured and removed immediately
- **REQUIRED**: Must jump if any of your pieces is next to an exposed enemy piece
- Must continue jumping if you land next to another exposed enemy piece
- **Exception**: Jumping into opponent's Castle ends your turn immediately
- Can change direction after each jump
- Can choose which piece to jump with and which enemy to capture (if multiple options exist)

**Special Exception to Jump Obligation**: The ONLY time you can ignore the jump obligation is when you just jumped into your own Castle on the previous turn and must now move that piece out.

**Notation**: `H4xJ4xL6` (jumped from H4 to J4 to L6, capturing pieces)

### 4. Knight's Charge
**Knights only** can combine a Canter and a Jump in a single move.

**Key Rules**:
- Must follow order: Canter(s) FIRST, then Jump(s)
- Never required to make a Knight's Charge
- If cantering brings the Knight next to an enemy piece, must jump it UNLESS you capture elsewhere in the same move
- Once jumping begins, must continue jumping if you land next to exposed enemy pieces
- Can change direction after each canter and after each jump
- Direction of last canter and first jump need not be the same

**Notation**: `F6-F8-H8xH10xJ12` (cantered from F6 to F8 to H8, then jumped to H10 to J12)

## Winning the Game

You win if:

1. **Castle Victory**: You move any two of your pieces into your opponent's Castle, OR
2. **Capture Victory**: You capture all opponent's pieces and have 2+ of your own pieces left, OR
3. **Stalemate Victory**: You have 2+ pieces and your opponent cannot make a legal move

## Draw Conditions

The game is drawn if:

1. Both players agree, OR
2. The same position appears for the third time with the same player to move, OR
3. 50 consecutive moves by each side with no captures and no piece moving onto an opponent's Castle Square, OR
4. Both players have only one piece remaining

## Your Own Castle Rules

**Entry Restrictions**:
- Cannot plain-move or canter into your own Castle
- Cannot canter into your own Castle during a Knight's Charge
- Can only enter by jumping over an enemy piece

**Forced Exit**:
- If you jump into your own Castle and could continue jumping out, you MUST continue
- If you jump into your own Castle and cannot continue jumping, you MUST move that piece out on your next turn (no exception)
- This is the ONLY time you can ignore the jump obligation - when moving a piece out of your own Castle after jumping in

**Jump Out Priority**:
- When moving out, must jump out if possible (instead of plain-moving or cantering)
- Can satisfy this with a Knight's Charge instead if possible

## Opponent's Castle Rules

**One-Way Entry**:
- Pieces that enter the opponent's Castle cannot come out
- Even if your piece lands next to an exposed enemy after jumping in, your turn ends immediately

**Castle Moves**:
- A piece in the opponent's Castle can move between the two Castle Squares
- This "Castle Move" is allowed exactly twice per game per piece

## Illegal Moves

If an illegal move is made:
- Must retract and make a legal move
- If discovered later, restart from the position just before the illegal move

---

*Based on the Official Rules of Camelot © 1999-2012 Michael Wortley Nolan and the World Camelot Federation*

