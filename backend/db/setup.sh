#!/bin/bash

USER="root"
PASSWORD="your_password"
DATABASE="cs348_project"

# List of SQL files to execute
SQL_FILES=("setup.sql" "team_crud.sql" "match_crud.sql" "elo_procedure.sql")

# Drop the database if it exists and recreate it
echo "Dropping database $DATABASE if it exists..."
mysql -u $USER -p$PASSWORD -e "DROP DATABASE IF EXISTS $DATABASE;"
echo "Creating database $DATABASE..."
mysql -u $USER -p$PASSWORD -e "CREATE DATABASE $DATABASE;"

echo "Database $DATABASE redefined."

# Loop through each file and execute it
for FILE in "${SQL_FILES[@]}"
do
  if [ -f "$FILE" ]; then
    echo "Executing $FILE..."
    mysql -u $USER -p$PASSWORD $DATABASE < $FILE
    echo "$FILE executed successfully."
  else
    echo "Error: $FILE not found."
  fi
done
