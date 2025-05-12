// models/BlogPost.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const BlogPost = sequelize.define('BlogPost', {
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [5, 100]
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [50, 5000]
      }
    },
    countryName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    visitDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    images: {
      type: DataTypes.JSON,
      allowNull: true
    }
  });

  BlogPost.associate = (models) => {
    BlogPost.belongsTo(models.User, { foreignKey: 'userId' });
    BlogPost.hasMany(models.Comment, { foreignKey: 'blogPostId' });
    BlogPost.hasMany(models.Like, { foreignKey: 'blogPostId' });
  };

  return BlogPost;
};