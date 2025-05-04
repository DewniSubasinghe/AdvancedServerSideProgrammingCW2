const { BlogPost, User, Like, Comment } = require('../models');
const { validationResult } = require('express-validator');
const { getCountryInfo } = require('../services/countryService');

const createPost = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { title, content, countryName, dateOfVisit } = req.body;
    const userId = req.userId; // From JWT middleware

    // Get country info
    const countryInfo = await getCountryInfo(countryName);

    const post = await BlogPost.create({
      title,
      content,
      countryName,
      dateOfVisit,
      userId,
      countryInfo: JSON.stringify(countryInfo) // Store country info with post
    });

    res.status(201).json({ post, countryInfo });
  } catch (error) {
    next(error);
  }
};

const getPosts = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sortBy = 'newest', search, country, author } = req.query;
    const offset = (page - 1) * limit;

    let order;
    switch (sortBy) {
      case 'newest':
        order = [['createdAt', 'DESC']];
        break;
      case 'likes':
        order = [[sequelize.literal('(SELECT COUNT(*) FROM Likes WHERE Likes.postId = BlogPost.id)'), 'DESC']];
        break;
      case 'comments':
        order = [[sequelize.literal('(SELECT COUNT(*) FROM Comments WHERE Comments.postId = BlogPost.id)'), 'DESC']];
        break;
      default:
        order = [['createdAt', 'DESC']];
    }

    const where = {};
    if (country) where.countryName = { [Op.iLike]: `%${country}%` };
    if (author) {
      where['$User.username$'] = { [Op.iLike]: `%${author}%` };
    }
    if (search) {
      where[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { content: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows } = await BlogPost.findAndCountAll({
      where,
      include: [
        { model: User, attributes: ['id', 'username', 'profilePicture'] },
        { model: Like, attributes: ['id'] },
        { model: Comment, attributes: ['id'] }
      ],
      order,
      limit,
      offset
    });

    const posts = rows.map(post => ({
      ...post.get({ plain: true }),
      likesCount: post.Likes.length,
      commentsCount: post.Comments.length,
      countryInfo: post.countryInfo ? JSON.parse(post.countryInfo) : null
    }));

    res.json({
      totalPosts: count,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
      posts
    });
  } catch (error) {
    next(error);
  }
};



module.exports = { createPost, getPosts /*, other methods */ };