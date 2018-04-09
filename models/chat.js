module.exports = function(sequelize, DataTypes) {
  return sequelize.define("Chat", {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    sender_id: DataTypes.BIGINT,
    receiver_id: DataTypes.BIGINT,
    content: DataTypes.TEXT,
    timestamp: DataTypes.DATE
  });
}
