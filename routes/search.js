const express = require('express');
const router = express.Router();
const { BlogPost, User, Like, Comment } = require('../models');
const { getCountryData } = require('../utils/helpers');
const axios = require('axios');
const { Op } = require('sequelize');

router.get('/', async (req, res) => {
  try {
    const { query, country, author, sort } = req.query;
   
    let where = {};
    let include = [{
      model: User,
      attributes: ['id', 'username'],
      required: false
    }];

    let countryData = null;
   
    if (country) {
      where.countryName = country;
      countryData = await getCountryData(country); // Get country data
    }

    if (author) {
      include[0].where = { username: author };
    }

    if (query) {
      where[Op.or] = [
        { title: { [Op.like]: `%${query}%` } },
        { content: { [Op.like]: `%${query}%` } }
      ];
    }

    let order = [['createdAt', 'DESC']];
    if (sort === 'popular') {
      order = [[Like, 'id', 'DESC']];
    } else if (sort === 'commented') {
      order = [[Comment, 'id', 'DESC']];
    }

    const posts = await BlogPost.findAll({
      where,
      include: [
        ...include,
        {
          model: Like,
          attributes: ['id']
        },
        {
          model: Comment,
          attributes: ['id']
        }
      ],
      order
    });

    const processedPosts = posts.map(post => {
      const postJson = post.get({ plain: true });
      return {
        ...postJson,
        User: postJson.User || { id: 0, username: 'Unknown' },
        likeCount: postJson.Likes ? postJson.Likes.length : 0,
        commentCount: postJson.Comments ? postJson.Comments.length : 0
      };
    });

    // Get all countries for dropdown
    let countries = [];
    try {
      const response = await axios.get('https://restcountries.com/v3.1/all');
      countries = response.data.map(c => c.name.common).sort();
    } catch (error) {
      console.error('Error fetching countries:', error);
      countries = [];
    }

    res.render('search', {
      title: 'Search Results',
      posts: processedPosts,
      countries,
      countryData,
      query: query || '',
      country: country || '',
      author: author || '',
      sort: sort || 'newest',
      user: req.user
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Search failed'
    });
  }
});

module.exports = router;