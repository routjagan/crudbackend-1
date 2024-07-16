const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const passport = require('passport');


const Post = require('../models/Post');

// Create a new post
router.post('/addpost', passport.authenticate('jwt', { session: false }), (req, res) => {
  const { title, description, latitude, longitude } = req.body;

 
  if (!title || !description || !latitude || !longitude) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    const newPost = new Post({
      title: req.body.title,
      description: req.body.description,
      createdBy: req.user.email,
      location: {
        type: 'Point',
        coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
      }
    });

    newPost.save().then(post => res.json(post));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});


// Get all posts by the authenticated user
router.get('/', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Post.find({ createdBy: req.user.id })
    .sort({ date: -1 })
    .then(posts => res.json({status:true,data:posts,message:" success"}))
});

// Get a single post by ID (owned by the authenticated user)
router.get('/list', passport.authenticate('jwt', { session: false }), async (req, res) => {
  console.log(req.user.id,'req.user.id')
  await Post.find({ createdBy: req.user.email })
    .then(post => {
      if (!post) {
        return res.status(404).json({ nopostfound: 'No post found with that ID' });
      }
      res.json({status:true,data:post,message:" success"})
    });
});
router.get('/listcount', passport.authenticate('jwt', { session: false }), async (req, res) => {
  console.log('req.user.email');
  try {
    const email = req.user.email;
    console.log('Email:', email);

    // Count active posts
    const activePostCount = await Post.countDocuments({
      createdBy: email,
      status: 'active'
    });
    console.log('Active Post Count:', activePostCount);

    // Count inactive posts
    const inactivePostCount = await Post.countDocuments({
      createdBy: email,
      status: 'inactive'
    });
    console.log('Inactive Post Count:', inactivePostCount);

    res.json({
      status: true,
      data: {
        activePosts: activePostCount,
        inactivePosts: inactivePostCount
      },
      message: "Success"
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ status: false, message: 'Server error' });
  }
});
// Get a single post by ID (owned by the authenticated user)
router.get('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Post.findOne({ _id: req.params.id })
    .then(post => {
      if (!post) {
        return res.status(404).json({ nopostfound: 'No post found with that ID' });
      }
      res.json({status:true,data:post,message:" success"})
    });
});

// Update a post
router.put('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  console.log(req.user,'req.user')
  await Post.findOneAndUpdate(
    { _id: req.params.id},
    {
      $set: {
        title: req.body.title,
        description: req.body.description,
        createdBy: req.user.email,
        location: {
          type: 'Point',
          coordinates: [parseFloat(req.body.longitude), parseFloat(req.body.latitude)]
        },
        status: req.body.status,
      }
    },
    { new: true }
  ).then(post => res.json(post));
});

// Delete a post
router.delete('/:id', passport.authenticate('jwt', { session: false }), async (req, res) => {
  await Post.findOneAndDelete({ _id: req.params.id })
    .then(post => {
      if (!post) {
        return res.status(404).json({ nopostfound: 'No post found with that ID' });
      }
      res.json({ success: true });
    });
});






module.exports = router;
