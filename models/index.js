const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'database.sqlite'),
  logging: false
});

// Define models
const User = require('./user')(sequelize);
const BlogPost = require('./blogPost')(sequelize);
const Comment = require('./comment')(sequelize);
const Like = require('./like')(sequelize);
const Follow = require('./follow')(sequelize);

// Define relationships
User.hasMany(BlogPost, { foreignKey: 'userId' });
BlogPost.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Comment, { foreignKey: 'userId' });
Comment.belongsTo(User, { foreignKey: 'userId' });

BlogPost.hasMany(Comment, { foreignKey: 'postId' });
Comment.belongsTo(BlogPost, { foreignKey: 'postId' });

User.belongsToMany(User, { 
  as: 'Followers', 
  through: Follow, 
  foreignKey: 'followingId', 
  otherKey: 'followerId' 
});

User.belongsToMany(User, { 
  as: 'Following', 
  through: Follow, 
  foreignKey: 'followerId', 
  otherKey: 'followingId' 
});

BlogPost.belongsToMany(User, { 
  through: Like, 
  as: 'likes', 
  foreignKey: 'postId' 
});
User.belongsToMany(BlogPost, { 
  through: Like, 
  as: 'likedPosts', 
  foreignKey: 'userId' 
});

module.exports = {
  sequelize,
  User,
  BlogPost,
  Comment,
  Like,
  Follow
};