import React, { useState, useEffect } from "react";
import axios from "axios";

const Teams = () => {
    const [teams, setTeams] = useState([]);
    const [teamName, setTeamName] = useState("");

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        const response = await axios.get("http://localhost:5000/teams");
        setTeams(response.data);
    };

    const createTeam = async () => {
        try {
            await axios.post("http://localhost:5000/teams", { name: teamName });
            fetchTeams(); 
        } catch (error) {
            if (error.response && error.response.status === 500) {
                alert("Error: A team with this name already exists. Please choose a different name.");
            } else {
                console.error("Error creating team:", error);
                alert("An error occurred. Please check your connection and try again.");
            }
        }
    };

    return (
        <div>
            <h2>Teams</h2>
            <input placeholder="Team Name" onChange={(e) => setTeamName(e.target.value)} />
            <button onClick={createTeam}>Create Team</button>
            <ul>
                {teams.map((team) => (
                    <li key={team.team_id}>{team.name}</li>
                ))}
            </ul>
        </div>
    );
};

export default Teams;
