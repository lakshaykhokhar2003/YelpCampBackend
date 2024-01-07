const {campgroundSchema, reviewSchema} = require("./schemas");
const Review = require('./models/reviewModel');
const Campground = require('./models/campgroundModel');

module.exports.validateCampground = (req, res, next) => {
    const {error} = campgroundSchema.validate(req.body)
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        return res.status(400).json({message: msg})
    } else {
        next();
    }
}
module.exports.validateReview = (req, res, next) => {
    const {error} = reviewSchema.validate(req.body)
    if (error) {
        const msg = error.details.map(el => el.message).join(',')
        return res.status(400).json({message: msg})
    } else {
        next()
    }
}

module.exports.isReviewAuthor = async (req, res, next) => {
    const {reviewId} = req.params;
    const review = await Review.findById(reviewId);
    if (!review.author.toString() === (req.query.user)) {
        return res.status(401).json({message: 'You do not have permission to do that!'});
    }
    next();
}

module.exports.isAuthor = async (req, res, next) => {
    const {id} = req.params;
    const campground = await Campground.findById(id);
    if (!campground.author.toString() === req.query.user) {
        return res.status(401).json({message: 'You do not have permission to do that!'});
    }
    next();
}