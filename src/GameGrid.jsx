import {useState} from 'react';
import './GameGrid.css'

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
    "The Witcher 3"
];

const GameGrid = () => {
    const [gamesPerRow, setGamesPerRow] = useState(8);
    const [gapPixels, setGridGap] = useState(30);
    return (
        <div style={{
            display: 'grid',
            width: '100%',
            boxSizing: 'border-box',
            gridTemplateColumns: `repeat(${gamesPerRow}, 1fr)`,
            gap: `${gapPixels}px`,
            padding: `${gapPixels}px`
        }}>
            {games.map((game) => (gameButton(game)))}
        </div>
    );
};

const gameButton = (game) => (
    <button
        key={game}
        className="game-button"
        onClick={() => {
        }}>
        <img
            draggable="false"
            src={`/Games/${game}.png`}
            alt={`${game} Game Cover`}/>
    </button>
)

export default GameGrid;