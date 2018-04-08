module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Liked_Users", {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: DataTypes.BIGINT,
    event_id: DataTypes.TEXT,
    liked_user_id: DataTypes.BIGINT,
  });
};
