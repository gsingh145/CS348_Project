DELIMITER $$

-- Elo Rating Calculation Function
CREATE FUNCTION calculate_elo(
    current_rating INT, 
    opponent_rating INT, 
    score_team INT, 
    score_opponent INT
) 
RETURNS INT
DETERMINISTIC
BEGIN
    DECLARE k_factor INT DEFAULT 32;
    DECLARE expected_score FLOAT;
    DECLARE actual_score FLOAT;
    DECLARE rating_change FLOAT;

    -- Calculate expected score based on current ratings
    SET expected_score = 1 / (1 + POW(10, (opponent_rating - current_rating) / 400));

    -- Determine actual score
    SET actual_score = CASE 
        WHEN score_team > score_opponent THEN 1.0
        WHEN score_team = score_opponent THEN 0.5
        ELSE 0.0
    END;

    -- Calculate rating change
    SET rating_change = k_factor * (actual_score - expected_score);

    -- Return the new rating, ensuring it is not negative
    RETURN GREATEST(ROUND(current_rating + rating_change), 0);
END$$

CREATE PROCEDURE recalculate_elo()
BEGIN
    DECLARE done INT DEFAULT 0;
    DECLARE match_id INT;
    DECLARE team_home_id INT;
    DECLARE team_away_id INT;
    DECLARE score_home INT;
    DECLARE score_away INT;
    DECLARE match_date TIMESTAMP;
    DECLARE home_elo INT;
    DECLARE away_elo INT;
    DECLARE new_home_elo INT;
    DECLARE new_away_elo INT;

    -- Cursor to iterate through all matches in chronological order
    DECLARE match_cursor CURSOR FOR
        SELECT *
        FROM Matches
        ORDER BY match_date;

    -- Handler to exit the loop when the cursor is exhausted
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

    START TRANSACTION;

    -- Debug: Reset Elo ratings to default
    SELECT 'Resetting all Elo ratings to 1500' AS debug_message;
    UPDATE Rankings SET elo_rating = 1500;

    SELECT * FROM Matches;
    -- Open the cursor
    OPEN match_cursor;

    match_loop: LOOP
        -- Fetch the next match
        FETCH match_cursor INTO match_id, team_home_id, team_away_id, score_home, score_away, match_date;

        -- Exit the loop if no more matches
        IF done = 1 THEN
            SELECT 'No more matches to process. Exiting loop.' AS debug_message;
            LEAVE match_loop;
        END IF;
        -- Debug: Log match details
        SELECT CONCAT('Processing match_id: ', match_id, 
                      ', team_home_id: ', team_home_id, 
                      ', team_away_id: ', team_away_id, 
                      ', score_home: ', score_home, 
                      ', score_away: ', score_away) AS debug_message;

        -- Get the current Elo ratings for both teams
        SELECT elo_rating INTO home_elo FROM Rankings WHERE team_id = team_home_id;
        SELECT elo_rating INTO away_elo FROM Rankings WHERE team_id = team_away_id;

        -- Debug: Log current Elo ratings
        SELECT CONCAT('Current Elo ratings - Home team: ', home_elo, 
                      ', Away team: ', away_elo) AS debug_message;

        -- Calculate the new Elo ratings using the calculate_elo function
        SET new_home_elo = calculate_elo(home_elo, away_elo, score_home, score_away);
        SET new_away_elo = calculate_elo(away_elo, home_elo, score_away, score_home);

        -- Debug: Log new Elo ratings
        SELECT CONCAT('New Elo ratings - Home team: ', new_home_elo, 
                      ', Away team: ', new_away_elo) AS debug_message;

        -- Update the Elo ratings in the Rankings table
        UPDATE Rankings SET elo_rating = new_home_elo WHERE team_id = team_home_id;
        UPDATE Rankings SET elo_rating = new_away_elo WHERE team_id = team_away_id;

        -- Debug: Log Elo update
        SELECT CONCAT('Updated Elo ratings for Home team (ID: ', team_home_id, 
                      ') and Away team (ID: ', team_away_id, ')') AS debug_message;
    END LOOP;

    -- Close the cursor
    CLOSE match_cursor;
    COMMIT;

    -- Debug: Procedure completed
    SELECT 'Elo recalculation completed successfully.' AS debug_message;
END$$

DELIMITER ;