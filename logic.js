function init(gridSize, numBombs) {
    const grid = [];

    // TODO: Instead of looping through the array again to add the bombs, create an array (n = numBombs) of random grid positions and if the current [i,j] matches, add bomb
    for (let i = 0; i < gridSize; i++) {
        grid.push([]);
        for (let j = 0; j < gridSize; j++) {
            grid[i].push({ status: "u", contains: " " });
        }
    }

    for (let i = 0; i < numBombs; i++) {
        grid[Math.floor(Math.random() * gridSize)][
            Math.floor(Math.random() * gridSize)
        ].contains = "b";
    }

    return grid;
}

export { init };
