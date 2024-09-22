import "./GameGrid.css";

const games = ["Spades 14", "Hearts 14", "Clubs 14", "Diamonds 14"];

const GameCard = (game) => (
    <button key={game} className="game-card" onClick={() => {}}>
        <img
            draggable="false"
            src={`/cards/${game}.jpg`}
            alt={`${game} Game Cover`}
        />
    </button>
);

export function GamesGrid() {
    return (
        <div className={"games-grid"}>
            {games.map((game) => GameCard(game))}
        </div>
    );
}
