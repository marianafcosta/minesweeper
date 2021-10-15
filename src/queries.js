// Queries

// -> Add player to db
db.players.insert({
    username: "test4",
    password: "????",
    highScore: { score: 1, timestamp: new Date() }, // Should be empty initially
});

// -> Check if player already exists in db
db.players.findOne({ username: "test2" });

// -> See current high score of a player
db.players.findOne({ username: "test2" }).highScore;

// -> Update player's high score
db.players.updateOne(
    { username: "test2" },
    { $set: { highScore: { score: 8, timestamp: new Date() } } }
);

// -> Fetch all high scores, ordered by score and date
db.players.find().sort({ "highScore.score": 1, "highScore.timestamp": -1 });
