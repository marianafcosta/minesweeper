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

    async updateHighScore(username, score) {
        if (!username) {
            return;
        }

        const filter = {
            username: username,
            gameMode: score.gameMode,
        };

        const options = { upsert: true };

        const update = [
            {
                $set: {
                    score: {
                        $cond: {
                            if: { $gt: ["$score", score.score] },
                            then: score.score,
                            else: "$score",
                        },
                    },
                    timestamp: {
                        $cond: {
                            if: { $gt: ["$score", score.score] },
                            then: score.timestamp,
                            else: "$timestamp",
                        },
                    },
                },
            },
        ];

        // TODO: Just one query
        await this.db
            .collection("highScores")
            .updateOne(
                { ...filter, score: { $exists: true } },
                update,
                options
            );

        await this.db.collection("highScores").updateOne(
            { ...filter, score: { $exists: false } },
            {
                $set: {
                    username,
                    score: score.score,
                    timestamp: score.timestamp,
                },
            }
        );
    }

    async resetHighScores() {
        await this.db.collection("highScores").deleteMany({});
    }

    async fetchHighScores() {
        return this.db
            .collection("highScores")
            .find()
            .project({ _id: 0 })
            .sort({ score: 1, timestamp: -1 })
            .limit(10)
            .toArray();
    }
}
