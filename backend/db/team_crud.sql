DELIMITER $$

CREATE PROCEDURE create_team(
    IN p_name VARCHAR(100)
)
BEGIN
    DECLARE v_team_id INT;

    START TRANSACTION;

    -- Insert into Teams table, ignore if duplicate
    INSERT IGNORE INTO Teams (name) VALUES (p_name);
    SET v_team_id = LAST_INSERT_ID();

    -- Only insert into Rankings if a new team was created
    IF v_team_id > 0 THEN
        INSERT INTO Rankings (team_id, elo_rating, matches_played)
        VALUES (v_team_id, 1500, 0);
    END IF;

    COMMIT;

    -- Return team details
    SELECT v_team_id AS team_id, p_name AS team_name;
END $$

DELIMITER ;