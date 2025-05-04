module.exports = (sequelize, DataTypes) => {
    const BlogPost = sequelize.define('BlogPost', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      countryName: {
        type: DataTypes.STRING,
        allowNull: false
      },
      dateOfVisit: {
        type: DataTypes.DATE,
        allowNull: false
      },
      images: {
        type: DataTypes.JSON,
        allowNull: true
      }
    }, {
      timestamps: true
    });
  
    return BlogPost;
  };