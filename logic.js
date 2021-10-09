function init(gridSize) {
    const grid = [];
    for (let i = 0; i < gridSize; i++) {
        grid.push([]);
        for (let j = 0; j < gridSize; j++) {
            grid[i].push({ status: "u", contains: " " });
        }
    }
    return grid;
}

export { init };
