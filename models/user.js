module.exports = function(sequelize, DataTypes) {
  return sequelize.define("User", {
    id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    first_name: DataTypes.TEXT,
    last_name: DataTypes.TEXT,
    email: DataTypes.TEXT,
    password: DataTypes.TEXT,
//    status: {
//      type: sequelize.ENUM('active', 'inactive'),
//      defaultValue: 'active'
//    },
    dob: DataTypes.DATE,
    gender: DataTypes.BOOLEAN, // false = male, true = female
    pictures: DataTypes.ARRAY(DataTypes.BLOB)
  });
}
