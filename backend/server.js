const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const { Op } = require('sequelize');

const { sequelize, Team, Match, Ranking, calculateElo, syncDatabase } = require("./db/db.js");

const app = express();

app.use(cors());
app.use(express.json());

const db = mysql.createPool({
    host: process.env.IP,
    user: "root",
    password: "your_password",
    database: "cs348_project",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Check database connection
db.getConnection((err, connection) => {
    if (err) {
        console.error("Database connection failed:", err);
        return;
    }
    console.log("Connected to database");
    connection.release(); // Release connection back to pool
});

// ==================== CREATE ====================

// **Create Match**
app.post("/create-match", async (req, res) => {
    try {
        const { team_home_id, team_away_id, score_home, score_away, match_date } = req.body;
        await db.promise().query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");
        const [result] = await db.promise().query("CALL create_match(?, ?, ?, ?, ?)", [
            team_home_id,
            team_away_id,
            score_home,
            score_away,
            match_date,
        ]);
        res.json({ message: "Match created successfully", result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// **Create Team**
app.post("/teams", async (req, res) => {
    const connection = await db.promise().getConnection();
    try {
        const { name } = req.body;

        // Start transaction

        await connection.query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");
        await connection.beginTransaction();

        // Call the stored procedure
        const [result] = await connection.query("CALL create_team(?)", [name]);

        // Commit transaction
        await connection.commit();
        res.json({ message: "Team created successfully", result });
    } catch (error) {
        // Rollback transaction on error
        await connection.rollback();
        console.error(error);
        res.status(500).json({ error: error.message });
    } finally {
        // Release connection back to the pool
        connection.release();
    }
});

// ==================== READ ====================

// **Get All Matches**
app.get("/matches", async (req, res) => {
    try {
        await db.promise().query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
        const result = await sequelize.query("CALL read_matches();", {
            raw: true,
            type: sequelize.QueryTypes.RAW,
        });
        res.json(result);
    } catch (error) {
        console.error("Error fetching matches:", error);
        res.status(500).json({ error: error.message });
    }
});

// **Get All Teams**
app.get("/teams", async (req, res) => {
    try {
        await db.promise().query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
        const teams = await Team.findAll();
        res.json(teams);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.get("/rankings", async (req, res) => {
    try {
        await db.promise().query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
        const ranking = await Ranking.findAll({
            include: [
                {
                    model: Team,
                    attributes: ["name"], // Only fetch the team name
                },
            ],
        });
        res.json(ranking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

app.get("/matches/filter", async (req, res) => {
    try {
        await db.promise().query("SET TRANSACTION ISOLATION LEVEL READ COMMITTED");
        const {
            startDate,
            endDate,
            minGF,
            maxGF,
            minGA,
            maxGA,
            minElo,
            maxElo
        } = req.query;

        const whereConditions = {
            [Op.and]: [],
        };

        // Date range filter
        if (startDate && endDate) {
            whereConditions[Op.and].push({
                match_date: {
                    [Op.between]: [new Date(startDate), new Date(endDate)],
                },
            });
        }

        // Goals For filter (score_home)
        if (minGF || maxGF) {
            const gfConditions = {};
            if (minGF) gfConditions[Op.gte] = parseInt(minGF, 10);
            if (maxGF) gfConditions[Op.lte] = parseInt(maxGF, 10);
            whereConditions[Op.and].push({ score_home: gfConditions });
        }

        // Goals Against filter (score_away)
        if (minGA || maxGA) {
            const gaConditions = {};
            if (minGA) gaConditions[Op.gte] = parseInt(minGA, 10);
            if (maxGA) gaConditions[Op.lte] = parseInt(maxGA, 10);
            whereConditions[Op.and].push({ score_away: gaConditions });
        }

        // Fetch matches with filtering
        const matches = await Match.findAll({
            where: whereConditions,
            include: [
                {
                    model: Team,
                    as: "HomeTeam",
                    attributes: ["name"],
                    include: {
                        model: Ranking,
                        attributes: ["elo_rating"],
                    },
                },
                {
                    model: Team,
                    as: "AwayTeam",
                    attributes: ["name"],
                    include: {
                        model: Ranking,
                        attributes: ["elo_rating"],
                    },
                },
            ],
        });

        // Filter matches based on Elo ratings post-fetch (if needed)
        const filteredMatches = matches.filter(match => {
            const homeElo = match.HomeTeam.Ranking.elo_rating;
            const awayElo = match.AwayTeam.Ranking.elo_rating;

            if ((minElo && (homeElo < minElo || awayElo < minElo)) ||
                (maxElo && (homeElo > maxElo || awayElo > maxElo))) {
                return false;
            }
            return true;
        });

        // Calculate summary statistics
        const totalMatches = filteredMatches.length;

        const avgElo = totalMatches
            ? filteredMatches.reduce(
                  (sum, match) =>
                      sum +
                      (match.HomeTeam.Ranking.elo_rating || 0) +
                      (match.AwayTeam.Ranking.elo_rating || 0),
                  0
              ) / (2 * totalMatches)
            : 0;

        const avgGoalsPerMatch = totalMatches
            ? filteredMatches.reduce(
                  (sum, match) => sum + match.score_home + match.score_away,
                  0
              ) / (totalMatches * 2)
            : 0;

        const avgEloDiff = totalMatches
            ? filteredMatches.reduce((sum, match) => {
                  const homeElo = match.HomeTeam.Ranking.elo_rating || 0;
                  const awayElo = match.AwayTeam.Ranking.elo_rating || 0;
                  return sum + Math.abs(homeElo - awayElo);
              }, 0) / totalMatches
            : 0;

        const avgGoalDiff = totalMatches
            ? filteredMatches.reduce(
                  (sum, match) => sum + Math.abs(match.score_home - match.score_away),
                  0
              ) / totalMatches
            : 0;

        res.json({
            matches: filteredMatches,
            summary: {
                totalMatches,
                avgElo,
                avgGoalsPerMatch,
                avgEloDiff,
                avgGoalDiff,
            },
        });
    } catch (error) {
        console.error("Error fetching filtered matches:", error);
        res.status(500).json({ error: error.message });
    }
});


// ==================== UPDATE ====================

// **Update Match**
app.put("/update-match", async (req, res) => {
    try {
        const { match_id, team_home_id, team_away_id, score_home, score_away, match_date } = req.body;
        await db.promise().query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");
        const [result] = await db.promise().query("CALL update_match(?, ?, ?, ?, ?, ?)", [
            match_id,
            team_home_id,
            team_away_id,
            score_home,
            score_away,
            match_date,
        ]);
        res.json({ message: "Match updated successfully", result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== DELETE ====================

// **Delete Match**
app.post("/delete-match", async (req, res) => {
    try {
        const { match_id } = req.body;
        await db.promise().query("SET TRANSACTION ISOLATION LEVEL SERIALIZABLE");
        const [result] = await db.promise().query("CALL delete_match(?)", [match_id]);
        res.json({ message: "Match deleted successfully", result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== SERVER ====================

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
