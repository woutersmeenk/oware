enum Player { A = "A", B = "B" }

enum InvalidReason {
    NoSeedsToSow
}

// Indicates which field is picked for the move
type Move = number

type ReadOnlyRecord<K extends string | number | symbol, T> = { readonly [P in K]: T; }

// State of a board
class Board {
    readonly currentPlayer: Player
    readonly captures: ReadOnlyRecord<Player, number>
    readonly fields: readonly number[]

    constructor(currentPlayer: Player, captures: Record<Player, number>, fields: number[]) {
        this.currentPlayer = currentPlayer
        this.captures = captures
        this.fields = fields
    }

    // Score of the board for the current player. Higher is better for both players
    score() {
        if (this.currentPlayer == Player.A) {
            return this.captures[Player.A] - this.captures[Player.B]
        } else {
            return this.captures[Player.B] - this.captures[Player.A]
        }
    }

    toString() {
        let str = "captures player A: " + this.captures[Player.A] + "\r\n"
        str += "captures player B: " + this.captures[Player.B] + "\r\n"
        str += "current player: " + this.currentPlayer + "\r\n"
        for (let index = 0; index < 6; index++) {
            str += this.fields[index] + "\t"
        }
        str += "\r\n"
        for (let index = 6; index < 12; index++) {
            str += this.fields[index] + "\t"
        }
        return str
    }

    // executes the move. Returns reason if invalid
    executeMove(move: Move): Board | InvalidReason {
        let newFields = [...this.fields]
        let newCaptures: Record<Player, number> = { ...this.captures }
        let startField = this.currentPlayer == Player.A ? move : move + 6

        if (newFields[startField] == 0) {
            return InvalidReason.NoSeedsToSow
        }

        let field = this.sow(startField, newFields)

        let beforeCapture = [...newFields]
        field = this.capture(field, newFields, newCaptures)

        // TODO check if opponent has seeds

        let newPlayer = this.currentPlayer == Player.A ? Player.B : Player.A
        return new Board(newPlayer, newCaptures, newFields)
    }

    private sow(startField: number, newFields: number[]) {
        let field = startField
        let seeds = newFields[startField]
        newFields[startField] = 0
        // Sow seeds
        while (seeds > 0) {
            // Move to next field
            field++
            // Wrap around if needed
            if (field >= newFields.length) {
                field = 0
            }
            if (field == startField) {
                // Skip initial field
                field++
            }
            seeds--
            newFields[field]++
        }
        return field
    }

    private capture(field: number, newFields: number[], newCaptures: Record<Player, number>) {
        while (this.isValidCapture(field, newFields)) {
            if (this.isValidCapture(field, newFields)) {
                newCaptures[this.currentPlayer] += newFields[field]
                newFields[field] = 0
            }
            // Move to previous
            field--
            if (field < 0) {
                field = newFields.length - 1
            }
        }
        return field
    }

    private isValidCapture(field: number, newFields: number[]) {
        // If number of seeds in the field is two or three we can capture them
        let twoOrThreeSeeds = newFields[field] == 2 || newFields[field] == 3
        let fieldIsOwnedByOpponent = this.currentPlayer == Player.A ? field >= 6 : field <= 6
        return twoOrThreeSeeds && fieldIsOwnedByOpponent
    }
}

// Initial board. Player A starts, no captures, all fields have 4 seeds
const initialBoard = new Board(Player.A, { "A": 0, "B": 0 }, [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4])

class GameTree {
    readonly board: Board
    moves?: ReadOnlyRecord<Move, GameTree | InvalidReason>
    maxScore?: number

    constructor(board: Board) {
        this.board = board
    }

    toString() {
        let str = this.board.toString() + "\r\n"
        str += "max score: " + this.maxScore
        return str;

    }

    generateMoves() {
        if (this.moves) {
            return this.moves
        }
        var moves: Record<Move, GameTree | InvalidReason> = {}
        for (let move = 0; move < 6; move++) {
            let result = this.board.executeMove(move)
            if (result instanceof Board) {
                moves[move] = new GameTree(result)
            } else {
                moves[move] = result
            }
        }
        this.moves = moves
        return moves
    }

    minMax(depth: number): number {
        if (depth == 0) {
            return this.board.score()
        }
        let moves = this.generateMoves()
        let maxScore = -100
        for (let move = 0; move < 6; move++) {
            let moveResult = moves[move]
            if (moveResult instanceof GameTree) {
                maxScore = Math.max(-moveResult.minMax(depth - 1), maxScore)
            }
        }

        this.maxScore = maxScore
        return maxScore
    }
}

let tree = new GameTree(initialBoard)
tree.minMax(7)
console.log(tree.toString() + "\r\n")








