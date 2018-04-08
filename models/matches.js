module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Matches", {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: DataTypes.BIGINT,
    matched_user_id: DataTypes.BIGINT,
    event_id: DataTypes.TEXT,
  });
};
