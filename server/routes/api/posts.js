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
router.post(
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

// @route   Get api/posts
// @desc    Get all posts
// @access  Private

router.get('/', auth, async (req, res) => {
    try {
        const posts = await Post.find().sort({ date: -1 });
        res.json(posts);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error ...');
    }
});

// @route   GET api/posts
// @desc    Get one post by id
// @access  Private

router.get('/:post_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.post_id);

        if (!post) return res.status(404).json({ msg: 'Post not found' });

        res.json(post);
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }

        res.status(500).send('Server error ...');
    }
});

// @route   DELETE api/posts/:post_id
// @desc    Delete one post by id
// @access  Private

router.delete('/:post_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.post_id);

        if (!post) return res.status(404).json({ msg: 'Post not found' });

        if (post.user.toString() !== req.user.id) {
            return res.status(404).json({
                msg: 'User not authorized to delete this post'
            });
        }

        await post.remove();

        res.json({ msg: 'Post successfully removed' });
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ msg: 'Post not found' });
        }
        res.status(500).send('Server error ...');
    }
});

// @route   PUT api/posts/like/:post_id
// @desc    like one post
// @access  Private

router.put('/like/:post_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.post_id);
        if (!post) return res.status(404).json({ msg: 'Post not found' });

        if (
            post.likes.filter(like => like.user.toString() === req.user.id)
                .length > 0
        ) {
            return res.status(400).json({ msg: 'Post already liked' });
        }

        post.likes.unshift({ user: req.user.id });

        await post.save();

        res.json(post.likes);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error ...');
    }
});

// @route   PUT api/posts/unlike/:post_id
// @desc    unlike one post
// @access  Private

router.put('/unlike/:post_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.post_id);

        if (
            post.likes.filter(like => like.user.toString() === req.user.id)
                .length === 0
        ) {
            return res.status(400).json({ msg: 'Post has not been liked yet' });
        }

        const removeIndex = post.likes
            .map(like => like.user.toString())
            .indexOf(req.user.id);

        post.likes.splice(removeIndex, 1);

        await post.save();

        res.json(post.likes);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error ...');
    }
});

// @route   Get api/posts/comment/:post_id
// @desc    Create a new comment for one post
// @access  Private
router.post(
    '/comment/:post_id',
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
            const post = await Post.findById(req.params.post_id);
            const newComment = {
                text: req.body.text,
                name: user.name,
                avatar: user.avatar,
                user: req.user.id
            };

            post.comments.unshift(newComment);

            await post.save();

            res.json(post.comments);
        } catch (err) {
            console.error(err);
            res.status(500).send('Server error ...');
        }
    }
);

// @route   Get api/posts/comment/:post_id/:comment_id
// @desc    Delete a commont
// @access  Private

router.delete('/comment/:post_id/:comment_id', auth, async (req, res) => {
    try {
        const post = await Post.findById(req.params.post_id);
        const comment = post.comments.find(
            comment => comment.id !== req.params.id
        );

        // check if comments exist
        if (!comment) {
            return res.status(404).json({ msg: 'comment does not exist' });
        }

        // Check if user is owner of comment
        if (comment.user.toString() !== req.user.id) {
            return res
                .status(404)
                .json({ msg: 'Not authorized to delete this comment' });
        }
        // Find and remove comment
        const removeIndex = post.comments
            .map(comment => comment.user.toString())
            .indexOf(req.user.id);

        post.comments.splice(removeIndex, 1);

        await post.save();

        res.json(post.comments);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error ...');
    }
});

module.exports = router;
