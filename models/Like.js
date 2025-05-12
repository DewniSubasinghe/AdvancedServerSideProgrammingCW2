// models/Like.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Like = sequelize.define('Like', {
    isLike: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true
    }
  });

  Like.associate = (models) => {
    Like.belongsTo(models.User, { foreignKey: 'userId' });
    Like.belongsTo(models.BlogPost, { foreignKey: 'blogPostId' });
  };

  return Like;
};