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
let gamesPerRow = 8;
let gapPixels = 30;
const cssRoot = document.querySelector(':root');
setCssVar('gapPixels', gapPixels + 'px');
setCssVar('gamesPerRow', gamesPerRow);

function createGameButtons() {
    const gameGrid = document.getElementById('gameGrid');
    games.forEach(game => {
        const gameButton = document.createElement('button');
        gameButton.classList.add("game-button");
        gameButton.addEventListener("click", () => {
            console.log('The ' + game + ' button was clicked.');
            gamesPerRow++;
            setCssVar('gamesPerRow', String(gamesPerRow));
        });
        gameButton.innerHTML = `<img src="./Games/${game}.png" alt="Game Cover">`;
        // TODO: Should images instead be background of buttons? dragging behavior difference?
        gameGrid.appendChild(gameButton);
    });
}

function setCssVar(name, value) {
    cssRoot.style.setProperty('--' + name, String(value));
}

createGameButtons();