const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth'); // protects our routes
const { check, validationResult } = require('express-validator/check');

const Post = require('../../models/Post');
const User = require('../../models/Users');
const Profile = require('../../models/Profile');

// @route   Get api/posts
// @desc    Create a new post
// @access  Private
router.get(
    '/',
    [
        auth,
        check('text')
            .not()
            .isEmpty()
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const user = await User.findById(req.user.id).select('-password');
            console.log(user.name)
            const newPost = new Post({
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id
            });

            const post = await newPost.save();
            
            res.json(post);
        } catch (err) {
            console.error(err);
            res.status(500).send('Server error ...');
        }
    }
);

module.exports = router;
