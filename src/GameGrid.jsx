import "./GameGrid.css";

const games = [
    "Baldur's Gate 3",
    "Celeste",
    "CrossCode",
    "Dark Souls I Remastered",
    "Dead Cells",
    "Hades",
    "Heroes of the Storm",
    "Hollow Knight",
    "Outer Wilds",
    "Sekiro - Shadows Die Twice",
    "Subnautica",
    "Tears of the Kingdom",
    "Terraria",
    "Tunic",
    "The Witcher 3",
];

const GameCard = (game) => (
    <button key={game} className="game-card" onClick={() => {}}>
        <img
            draggable="false"
            src={`/cards/${game}.png`}
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
