DELIMITER $$

CREATE PROCEDURE create_match(
    IN p_team_home_id INT, 
    IN p_team_away_id INT, 
    IN p_score_home INT, 
    IN p_score_away INT, 
    IN p_match_date TIMESTAMP
)
BEGIN
    START TRANSACTION;

    INSERT INTO Matches (team_home_id, team_away_id, score_home, score_away, match_date) 
    VALUES (p_team_home_id, p_team_away_id, p_score_home, p_score_away, p_match_date);

    UPDATE Rankings 
    SET matches_played = matches_played + 1 
    WHERE team_id = p_team_home_id;

    UPDATE Rankings 
    SET matches_played = matches_played + 1 
    WHERE team_id = p_team_away_id;

    CALL recalculate_elo();

    COMMIT;
END$$

CREATE PROCEDURE update_match(
    IN p_match_id INT,
    IN p_team_home_id INT, 
    IN p_team_away_id INT, 
    IN p_score_home INT, 
    IN p_score_away INT,
    IN p_match_date TIMESTAMP
)
BEGIN
    DECLARE old_team_home_id INT;
    DECLARE old_team_away_id INT;

    START TRANSACTION;

    -- Fetch the old team IDs for the match
    SELECT team_home_id, team_away_id 
    INTO old_team_home_id, old_team_away_id
    FROM Matches
    WHERE match_id = p_match_id;

    -- Decrement matches_played for the old home team if it is different
    IF old_team_home_id != p_team_home_id THEN
        UPDATE Rankings 
        SET matches_played = matches_played - 1
        WHERE team_id = old_team_home_id;
    END IF;

    -- Decrement matches_played for the old away team if it is different
    IF old_team_away_id != p_team_away_id THEN
        UPDATE Rankings 
        SET matches_played = matches_played - 1
        WHERE team_id = old_team_away_id;
    END IF;

    -- Update the match details, including the match date
    UPDATE Matches 
    SET 
        team_home_id = p_team_home_id, 
        team_away_id = p_team_away_id, 
        score_home = p_score_home, 
        score_away = p_score_away,
        match_date = p_match_date
    WHERE match_id = p_match_id;

    -- Increment matches_played for the new home team if it is different
    IF old_team_home_id != p_team_home_id THEN
        UPDATE Rankings 
        SET matches_played = matches_played + 1
        WHERE team_id = p_team_home_id;
    END IF;

    -- Increment matches_played for the new away team if it is different
    IF old_team_away_id != p_team_away_id THEN
        UPDATE Rankings 
        SET matches_played = matches_played + 1
        WHERE team_id = p_team_away_id;
    END IF;

    -- Recalculate Elo ratings after the update
    CALL recalculate_elo();

    COMMIT;
END$$

CREATE PROCEDURE delete_match(IN p_match_id INT)
BEGIN
    DECLARE home_team_id INT;
    DECLARE away_team_id INT;

    START TRANSACTION;

    SELECT team_home_id, team_away_id 
    INTO home_team_id, away_team_id
    FROM Matches
    WHERE match_id = p_match_id;

    UPDATE Rankings 
    SET matches_played = GREATEST(matches_played - 1, 0)
    WHERE team_id = home_team_id;

    UPDATE Rankings 
    SET matches_played = GREATEST(matches_played - 1, 0)
    WHERE team_id = away_team_id;

    DELETE FROM Matches 
    WHERE match_id = p_match_id;

    CALL recalculate_elo();

    COMMIT;
END$$

CREATE PROCEDURE read_matches()
BEGIN
    SELECT 
        m.match_id,
        m.match_date,
        t1.name AS team_home_name,
        t2.name AS team_away_name,
        m.score_home,
        m.score_away
    FROM Matches m
    JOIN Teams t1 ON m.team_home_id = t1.team_id
    JOIN Teams t2 ON m.team_away_id = t2.team_id
    ORDER BY m.match_date; -- Sort by match date
END$$

DELIMITER ;