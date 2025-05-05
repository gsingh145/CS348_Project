const { Sequelize, DataTypes } = require('sequelize');

// Create Sequelize connection
const sequelize = new Sequelize(
  'cs348_project', 
  'root', 
  'your_password', 
  {
    host: process.env.IP,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Define Team Model
const Team = sequelize.define('Team', {
  team_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  }
}, {
  tableName: 'Teams',
  timestamps: false
});

// Define Match Model
const Match = sequelize.define('Match', {
  match_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  team_home_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Teams',
      key: 'team_id'
    }
  },
  team_away_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Teams',
      key: 'team_id'
    }
  },
  score_home: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  score_away: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  match_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'Matches',
  timestamps: false
});

// Define Ranking Model
const Ranking = sequelize.define('Ranking', {
  ranking_id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  team_id: {
    type: DataTypes.INTEGER,
    unique: true,
    references: {
      model: 'Teams',
      key: 'team_id'
    }
  },
  elo_rating: {
    type: DataTypes.INTEGER,
    defaultValue: 1500,
    validate: {
      min: 0
    }
  },
  matches_played: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0
    }
  }
}, {
  tableName: 'Rankings',
  timestamps: false
});

// Define Associations
Team.hasOne(Ranking, { 
  foreignKey: 'team_id',
  onDelete: 'CASCADE'
});
Ranking.belongsTo(Team, { 
  foreignKey: 'team_id',
  onDelete: 'CASCADE'
});

Team.hasMany(Match, { 
  foreignKey: 'team_home_id', 
  as: 'HomeMatches' 
});
Team.hasMany(Match, { 
  foreignKey: 'team_away_id', 
  as: 'AwayMatches' 
});

Match.belongsTo(Team, { 
  foreignKey: 'team_home_id', 
  as: 'HomeTeam' 
});
Match.belongsTo(Team, { 
  foreignKey: 'team_away_id', 
  as: 'AwayTeam' 
});

// Elo Rating Calculation Function
function calculateElo(currentRating, opponentRating, score, opponentScore) {
  const kFactor = 32;
  
  // Calculate expected score
  const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - currentRating) / 400));
  
  // Determine actual score
  let actualScore;
  if (score > opponentScore) actualScore = 1.0;
  else if (score === opponentScore) actualScore = 0.5;
  else actualScore = 0.0;
  
  // Calculate rating change
  const ratingChange = kFactor * (actualScore - expectedScore);
  
  return Math.round(currentRating + ratingChange);
}

// Database Synchronization Function
async function syncDatabase() {
  try {
    await sequelize.sync({ alter: true });
    console.log('Database synchronized successfully');
  } catch (error) {
    console.error('Unable to synchronize database:', error);
  }
}

// Export models and utilities
module.exports = {
  sequelize,
  Team,
  Match,
  Ranking,
  calculateElo,
  syncDatabase
};