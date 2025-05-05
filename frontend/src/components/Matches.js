import React, { useState, useEffect } from "react";
import axios from "axios";

const Matches = () => {
    const [matches, setMatches] = useState([]);
    const [teams, setTeams] = useState([]); // State to store teams
    const [matchData, setMatchData] = useState({ match_id: null, team_home_id: "", team_away_id: "", score_home: "", score_away: "", match_date: "" });

    useEffect(() => {
        fetchMatches();
        fetchTeams(); // Fetch teams for dropdown
    }, []);

    const fetchMatches = async () => {
        try {
            const response = await axios.get("http://localhost:5000/matches");
            setMatches(response.data);
        } catch (error) {
            console.error("Error fetching matches:", error);
        }
    };

    const fetchTeams = async () => {
        try {
            const response = await axios.get("http://localhost:5000/teams");
            setTeams(response.data);
        } catch (error) {
            console.error("Error fetching teams:", error);
        }
    };

    const handleChange = (e) => {
        setMatchData({ ...matchData, [e.target.name]: e.target.value });
    };

    const validateMatchData = () => {
        const { team_home_id, team_away_id, score_home, score_away } = matchData;

        if (!team_home_id || !team_away_id) {
            alert("Please select both home and away teams.");
            return false;
        }

        if (team_home_id === team_away_id) {
            alert("Home and away teams cannot be the same.");
            return false;
        }

        if (score_home < 0 || score_away < 0) {
            alert("Scores cannot be negative.");
            return false;
        }

        return true;
    };

    const createMatch = async () => {
        if (!validateMatchData()) {
            return; // Stop submission if validation fails
        }

        try {
            await axios.post("http://localhost:5000/create-match", matchData);
            fetchMatches();
            setMatchData({ match_id: null, team_home_id: "", team_away_id: "", score_home: "", score_away: "", match_date: "" }); // Clear form
        } catch (error) {
            console.error("Error creating match:", error);
            alert("Failed to create match. Please try again.");
        }
    };

    const updateMatch = async () => {
        if (!validateMatchData()) {
            return; // Stop submission if validation fails
        }

        try {
            // Send match_id in the body along with other match data
            await axios.put("http://localhost:5000/update-match", matchData);
            fetchMatches();
            setMatchData({ match_id: null, team_home_id: "", team_away_id: "", score_home: "", score_away: "", match_date: "" }); // Clear form
        } catch (error) {
            console.error("Error updating match:", error);
            alert("Failed to update match. Please try again.");
        }
    };

    const deleteMatch = async (matchId) => {
        try {
            // Send match_id in the request body as an object
            await axios.post("http://localhost:5000/delete-match", { match_id: matchId });
            fetchMatches(); // Refresh the match list after deletion
        } catch (error) {
            console.error("Error deleting match:", error);
            alert("Failed to delete match. Please try again.");
        }
    };

    const startEditing = (match) => {
        setMatchData({
            match_id: match.match_id,
            team_home_id: match.team_home_id,
            team_away_id: match.team_away_id,
            score_home: match.score_home,
            score_away: match.score_away,
            match_date: match.match_date,
        });
    };

    return (
        <div>
            <h2>Matches</h2>
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    matchData.match_id ? updateMatch() : createMatch();
                }}
            >
                <label>
                    Home Team:
                    <select name="team_home_id" value={matchData.team_home_id} onChange={handleChange}>
                        <option value="">Select Home Team</option>
                        {teams.map((team) => (
                            <option key={team.team_id} value={team.team_id}>
                                {team.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Away Team:
                    <select name="team_away_id" value={matchData.team_away_id} onChange={handleChange}>
                        <option value="">Select Away Team</option>
                        {teams.map((team) => (
                            <option key={team.team_id} value={team.team_id}>
                                {team.name}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Home Score:
                    <input type="number" name="score_home" value={matchData.score_home} onChange={handleChange} />
                </label>
                <label>
                    Away Score:
                    <input type="number" name="score_away" value={matchData.score_away} onChange={handleChange} />
                </label>
                <label>
                    Match Date:
                    <input
                        type="date"
                        name="match_date"
                        value={matchData.match_date}
                        onChange={handleChange}
                    />
                </label>
                <button type="submit">{matchData.match_id ? "Update Match" : "Create Match"}</button>
            </form>
            <h3>Match List</h3>
            <ul>
                {matches ? (
                    matches.map((match) => (
                        <li key={match.match_id}>
                            {match.team_home_name} vs {match.team_away_name} - {match.score_home}:{match.score_away} on{" "}
                            {new Date(match.match_date).toLocaleDateString()}
                            <button onClick={() => startEditing(match)}>Edit</button>
                            <button onClick={() => deleteMatch(match.match_id)}>Delete</button>
                        </li>
                    ))
                ) : (
                    <p>No matches available.</p> // Display this message when there are no matches
                )}
            </ul>
        </div>
    );
};

export default Matches;