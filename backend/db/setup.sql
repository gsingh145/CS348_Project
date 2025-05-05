USE cs348_project;
CREATE TABLE Teams (
    team_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);
CREATE TABLE Matches (
    match_id INT AUTO_INCREMENT PRIMARY KEY,
    team_home_id INT,
    team_away_id INT,
    score_home INT NOT NULL,
    score_away INT NOT NULL,
    match_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_home_id) REFERENCES Teams(team_id),
    FOREIGN KEY (team_away_id) REFERENCES Teams(team_id)
);
-- Rankings Table
CREATE TABLE Rankings (
    ranking_id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT UNIQUE,
    elo_rating INT DEFAULT 1500,
    matches_played INT DEFAULT 0,
    FOREIGN KEY (team_id) REFERENCES Teams(team_id)
);

