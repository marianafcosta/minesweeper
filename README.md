# Minesweeper

My goal with this project is to work on my full-stack skills, starting with the creation of a simple CLI version of Minesweeper and gradually working my way towards a game that can be played online. For now, I've set up 5 milestones for this project, each of them with its own release.

-   [x] CLI (a minesweeper clone)
-   [x] Server (send commands for the server to process and receive game states with the changes applied)
-   [x] DB (persistance; store high scores)
-   [x] Frontend (a website to play the game)
-   [ ] Deployment

My plan is to get a MVP ready for all of them, even if the solutions found are not ideal.

# Notes

-   I can't get Heroku to build the app in the `heroku-postbuild` phase, so for now I have to build the application manually and commit the build files

## Instructions

```
cd src

# CLI
npm run cli

# Server
npm run server

# Concurrent
npm run dev

```
