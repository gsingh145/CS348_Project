import React, { useState, useEffect } from "react";
import axios from "axios";

const Summary = () => {
    const [rankings, setRankings] = useState([]);
    const [filters, setFilters] = useState({
        startDate: "",
        endDate: "",
        minGF: "",
        maxGF: "",
        minGA: "",
        maxGA: "",
        minElo: "",
        maxElo: "",
    });
    const [matches, setMatches] = useState([]);
    const [summary, setSummary] = useState({});

    const baseurl = `http://${process.env.REACT_APP_IP}:5000/`;

    useEffect(() => {
        fetchRankings();
    }, []);

    const fetchRankings = async () => {
        try {
            const response = await axios.get(baseurl + "rankings");

            setRankings(response.data);
        } catch (error) {
            console.error("Error fetching rankings:", error);
        }
    };

    const fetchFilteredMatches = async () => {
        try {
            const response = await axios.get(baseurl + "matches/filter", {
                params: filters,
            });
            setMatches(response.data.matches);
            setSummary(response.data.summary);
        } catch (error) {
            console.error("Error fetching filtered matches:", error);
        }
    };

    const handleChange = (e) => {
        setFilters({ ...filters, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        fetchFilteredMatches();
    };

    return (
        <div>
            {/* Rankings Section */}
            <h2>Rankings</h2>
            <table>
                <thead>
                    <tr>
                        <th>Rank</th>
                        <th>Team Name</th>
                        <th>Elo Rating</th>
                        <th>Matches Played</th>
                    </tr>
                </thead>
                <tbody>
                    {rankings
                        .sort((a, b) => b.elo_rating - a.elo_rating) // Sort by elo_rating in descending order
                        .map((ranking, index) => (
                            <tr key={ranking.team_id}>
                                <td>{index + 1}</td>
                                <td>{ranking.Team.name}</td>
                                <td>{ranking.elo_rating}</td>
                                <td>{ranking.matches_played}</td>
                            </tr>
                        ))}
                </tbody>
            </table>

            {/* Match Filters Section */}
            <h2>Filter Matches</h2>
            <form onSubmit={handleSubmit}>
                <label>
                    Start Date:
                    <input type="date" name="startDate" value={filters.startDate} onChange={handleChange} />
                </label>
                <label>
                    End Date:
                    <input type="date" name="endDate" value={filters.endDate} onChange={handleChange} />
                </label>
                <label>
                    Min GF:
                    <input type="number" name="minGF" value={filters.minGF} onChange={handleChange} />
                </label>
                <label>
                    Max GF:
                    <input type="number" name="maxGF" value={filters.maxGF} onChange={handleChange} />
                </label>
                <label>
                    Min GA:
                    <input type="number" name="minGA" value={filters.minGA} onChange={handleChange} />
                </label>
                <label>
                    Max GA:
                    <input type="number" name="maxGA" value={filters.maxGA} onChange={handleChange} />
                </label>
                <label>
                    Min Elo:
                    <input type="number" name="minElo" value={filters.minElo} onChange={handleChange} />
                </label>
                <label>
                    Max Elo:
                    <input type="number" name="maxElo" value={filters.maxElo} onChange={handleChange} />
                </label>
                <button type="submit">Filter</button>
            </form>

            {/* Match List Section */}
            <h2>Match List</h2>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Home Team</th>
                        <th>Away Team</th>
                        <th>Score</th>
                    </tr>
                </thead>
                <tbody>
                    {matches.map((match) => (
                        <tr key={match.match_id}>
                            <td>{new Date(match.match_date).toLocaleDateString()}</td>
                            <td>{match.HomeTeam?.name || "Unknown"}</td> {/* Handle undefined HomeTeam */}
                            <td>{match.AwayTeam?.name || "Unknown"}</td> {/* Handle undefined AwayTeam */}
                            <td>
                                {match.score_home} - {match.score_away}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Match Summary Section */}
            <h2>Match Summary</h2>
            <p>Total Matches: {summary.totalMatches}</p>
            <p>Average Elo: {summary.avgElo?.toFixed(2)}</p>
            <p>Average Goals per Match: {summary.avgGoalsPerMatch?.toFixed(2)}</p>
            <p>Average Elo Difference: {summary.avgEloDiff?.toFixed(2)}</p>
            <p>Average Goal Differential: {summary.avgGoalDiff?.toFixed(2)}</p>
        </div>
    );
};

export default Summary;
