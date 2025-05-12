const { BlogPost, User, Like, Comment } = require('../models');
const { getCountryData } = require('../utils/helpers');
const axios = require('axios');

module.exports = {
    getPosts: async (req, res) => {
        try {
            const posts = await BlogPost.findAll({
                // In the getPosts function, update the include section:
                include: [
                  {
                    model: User,
                    attributes: ['id', 'username'],
                    required: false
                  },
                  {
                    model: Like,
                    attributes: ['id']
                  },
                  {
                    model: Comment,
                    attributes: ['id']
                  }
                ],
                order: [['createdAt', 'DESC']]
            });

            const postsWithCounts = posts.map(post => {
                const postJson = post.get({ plain: true });
                return {
                    ...postJson,
                    User: postJson.User || { id: 0, username: 'Unknown' },
                    likeCount: postJson.Likes ? postJson.Likes.length : 0,
                    commentCount: postJson.Comments ? postJson.Comments.length : 0
                };
            });

            res.render('blog/list', {
                title: 'All Travel Tales',
                posts: postsWithCounts,
                user: req.user
            });
        } catch (error) {
            console.error('Error getting posts:', error);
            res.status(500).render('error', {
                title: 'Error',
                message: 'Failed to load posts'
            });
        }
    },

    getCreateForm: async (req, res) => {
        try {
            const response = await axios.get('https://restcountries.com/v3.1/all');
            const countries = response.data.map(c => ({
                name: c.name.common,
                flag: c.flags?.png || ''
            })).sort((a, b) => a.name.localeCompare(b.name));

            res.render('blog/create', {
                title: 'Create New Post',
                countries,
                user: req.user,
                errors: null,
                formData: null
            });
        } catch (error) {
            console.error('Error fetching countries:', error);
            res.status(500).render('error', {
                title: 'Error',
                message: 'Failed to load create form'
            });
        }
    },

    getPost: async (req, res) => {
        try {
            const post = await BlogPost.findByPk(req.params.id, {
                include: [
                    {
                        model: User,
                        attributes: ['id', 'username'],
                        required: false
                    },
                    {
                        model: Like,
                        include: [{
                            model: User,
                            attributes: ['id'],
                            required: false
                        }]
                    },
                    {
                        model: Comment,
                        include: [{
                            model: User,
                            attributes: ['id', 'username'],
                            required: false
                        }]
                    }
                ]
            });

            if (!post) {
                return res.status(404).render('error', {
                    title: 'Not Found',
                    message: 'Post not found'
                });
            }

            const postJson = post.get({ plain: true });
            postJson.User = postJson.User || { id: 0, username: 'Unknown' };

            if (postJson.Comments) {
                postJson.Comments = postJson.Comments.map(comment => ({
                    ...comment,
                    User: comment.User || { id: 0, username: 'Unknown' }
                }));
            }

            if (postJson.Likes) {
                postJson.Likes = postJson.Likes.map(like => ({
                    ...like,
                    User: like.User || { id: 0 }
                }));
            }

            const countryData = await getCountryData(post.countryName) || {
                flag: '',
                currencies: ['Unknown'],
                capital: 'Unknown',
                region: 'Unknown'
            };

            const userLiked = req.user ? 
                postJson.Likes.some(like => like.userId === req.user.id) : 
                false;

            res.render('blog/show', {
                title: post.title,
                post: {
                    ...postJson,
                    likeCount: postJson.Likes ? postJson.Likes.length : 0,
                    commentCount: postJson.Comments ? postJson.Comments.length : 0,
                    userLiked
                },
                countryData,
                user: req.user
            });
        } catch (error) {
            console.error('Error getting post:', error);
            res.status(500).render('error', {
                title: 'Error',
                message: 'Failed to load post'
            });
        }
    },

    getEditForm: async (req, res) => {
        try {
            const post = await BlogPost.findOne({
                where: {
                    id: req.params.id,
                    userId: req.user.id
                }
            });

            if (!post) {
                return res.status(404).render('error', {
                    title: 'Not Found',
                    message: 'Post not found or not authorized'
                });
            }

            const response = await axios.get('https://restcountries.com/v3.1/all');
            const countries = response.data.map(c => ({
                name: c.name.common,
                flag: c.flags?.png || ''
            })).sort((a, b) => a.name.localeCompare(b.name));

            const countryData = await getCountryData(post.countryName) || {
                flag: '',
                currencies: ['Unknown'],
                capital: 'Unknown',
                region: 'Unknown'
            };

            res.render('blog/edit', {
                title: 'Edit Post',
                post: {
                    ...post.get({ plain: true }),
                    countryData
                },
                countries,
                user: req.user
            });
        } catch (error) {
            console.error('Error getting edit form:', error);
            res.status(500).render('error', {
                title: 'Error',
                message: 'Failed to load edit form'
            });
        }
    },

    createPost: async (req, res) => {
        try {
            const post = await BlogPost.create({
                title: req.body.title,
                content: req.body.content,
                countryName: req.body.countryName,
                visitDate: req.body.visitDate,
                userId: req.user.id
            });
            res.redirect(`/blog/${post.id}`);
        } catch (error) {
            console.error('Error creating post:', error);
            
            try {
                const response = await axios.get('https://restcountries.com/v3.1/all');
                const countries = response.data.map(c => ({
                    name: c.name.common,
                    flag: c.flags?.png || ''
                })).sort((a, b) => a.name.localeCompare(b.name));

                res.status(500).render('blog/create', {
                    title: 'Create New Post',
                    countries,
                    user: req.user,
                    errors: [{ msg: 'Failed to create post' }],
                    formData: req.body
                });
            } catch (err) {
                console.error('Error fetching countries:', err);
                res.status(500).render('error', {
                    title: 'Error',
                    message: 'Failed to load create form'
                });
            }
        }
    },

    updatePost: async (req, res) => {
        try {
            const post = await BlogPost.findOne({
                where: {
                    id: req.params.id,
                    userId: req.user.id
                }
            });

            if (!post) {
                return res.status(404).render('error', {
                    title: 'Not Found',
                    message: 'Post not found or not authorized'
                });
            }

            await post.update({
                title: req.body.title,
                content: req.body.content,
                countryName: req.body.countryName,
                visitDate: req.body.visitDate
            });

            res.redirect(`/blog/${post.id}`);
        } catch (error) {
            console.error('Error updating post:', error);
            res.status(500).render('error', {
                title: 'Error',
                message: 'Failed to update post'
            });
        }
    },

    deletePost: async (req, res) => {
      try {
        const post = await BlogPost.findOne({
          where: {
            id: req.params.id,
            userId: req.user.id
          }
        });

        if (!post) {
          return res.status(404).render('error', {
            title: 'Not Found',
            message: 'Post not found or not authorized'
          });
        }

        await post.destroy();
        res.redirect('/'); // Redirect to home page after deletion
      } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).render('error', {
          title: 'Error',
          message: 'Failed to delete post'
        });
      }
    },


    likePost: async (req, res) => {
      try {
        if (!req.user) {
          return res.status(401).json({ success: false, error: 'Not authenticated' });
        }

        const [like, created] = await Like.findOrCreate({
          where: {
            userId: req.user.id,
            blogPostId: req.params.id
          },
          defaults: {
            isLike: true
          }
        });

        if (!created) {
          await like.update({ isLike: !like.isLike });
        }

        const likeCount = await Like.count({
          where: {
            blogPostId: req.params.id,
            isLike: true
          }
        });

        // Return minimal data needed for frontend update
        res.json({
          success: true,
          isLike: like.isLike,
          likeCount
        });
      } catch (error) {
        console.error('Error liking post:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to update like'
        });
      }
    },

    commentOnPost: async (req, res) => {
        try {
            if (!req.user) {
                return res.status(401).json({ success: false, error: 'Not authenticated' });
            }

            const comment = await Comment.create({
                content: req.body.content,
                userId: req.user.id,
                blogPostId: req.params.id
            });

            res.redirect(`/blog/${req.params.id}#comments`);
        } catch (error) {
            console.error('Error adding comment:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to add comment'
            });
        }
    }
};