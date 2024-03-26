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
const gamesPerRow = 7;
const gapRatio = 1 / 8;
/* cardWidth * gamesPerRow + gapWidth * gapsPerRow = 100% (row width)
gapsPerRow = gamesPerRow - 1
gapWidth = cardWidth * gapRatio (e.g. 1/8)
c * g + (c/8) * (g-1) = rowWidth
cardWidth = rowWidth / (1.125g - 0.125) */

const cardWidth = 100 / ((1 + gapRatio) * gamesPerRow - gapRatio);
const gapSize = cardWidth * gapRatio;
function createGameButtons() {
    const gameGrid = document.getElementById("gameGrid");
    gameGrid.style.gap = gapSize + '%';

    games.forEach(game => {
        const gameButton = document.createElement("button");
        gameButton.classList.add("game-button");
        gameButton.style.width = cardWidth + '%';
        gameButton.innerHTML = `<img src="./Games/${game}.png" alt="Game Cover">`;
        gameGrid.appendChild(gameButton);
    });
}

createGameButtons();