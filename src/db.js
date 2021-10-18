import { MongoClient, ObjectId } from "mongodb";

export class DB {
    static url = "mongodb://localhost:27017";
    static dbName = "minesweeper";

    constructor() {
        this._mongoClient = new MongoClient(DB.url);
        this.db = null;
    }

    async connect() {
        await this._mongoClient.connect();
        this.db = this._mongoClient.db(DB.dbName);
    }

    async insertPlayer(username, password) {
        this.db.collection("players").insertOne({
            username,
            password: await argon2.hash(password),
        });
    }

    async findPlayer(username) {
        return this.db.collection("players").findOne({ username });
    }

    async updateHighScore(userId, score) {
        // TODO: Just one query
        await this.db
            .collection("players")
            .updateOne(
                { _id: ObjectId(userId) },
                { $min: { highScore: score } }
            );

        await this.db
            .collection("players")
            .updateOne(
                { _id: ObjectId(userId), highScore: { $exists: false } },
                { $set: { highScore: score } }
            );
    }

    async fetchHighScores() {
        return this.db
            .collection("players")
            .find()
            .project({ password: 0, _id: 0 })
            .sort({ "highScore.score": 1, "highScore.timestamp": -1 })
            .limit(10)
            .toArray();
    }
}
