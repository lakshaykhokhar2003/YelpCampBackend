const CampgroundRoutes = require("../models/campgroundModel");
const Review = require("../models/reviewModel");
const {cloudinary} = require("../cloudinary");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN
const geocoder = mbxGeocoding({accessToken: mapboxToken})

module.exports.showCampgrounds = async (req, res) => {
    try {
        const campgrounds = await CampgroundRoutes.find({}).sort({createdAt: -1})
        res.json({campgrounds});
    } catch (err) {
        console.log("Error in campgrounds: ", err.message)
        res.status(500).json({message: err.message})
    }
}

module.exports.showCampgroundsById = async (req, res) => {
    try {
        const campgrounds = await CampgroundRoutes.findById(req.params.id).populate({
            path: 'reviews', populate: {
                path: 'author'
            }
        }).populate('author')
        res.json({campgrounds})
    } catch (err) {
        console.log("Error in campgrounds (id): ", err.message)
        res.status(500).json({message: err.message});
    }
}

module.exports.deleteCampgrounds = async (req, res) => {
    const {id} = req.params;
    try {
        const campground = await CampgroundRoutes.findById(id)
        campground.reviews.map(async (review) => {
            await Review.findByIdAndDelete(review)
        })
        for (let filename of campground.images) {
            if (filename.filename.length > 0) {
                await cloudinary.uploader.destroy(filename.filename)
            }
        }
        await CampgroundRoutes.findByIdAndDelete(id);
        return res.status(200).json({message: 'Successfully Deleted The Campground'});
    } catch (err) {
        console.log("Error in campgrounds (id): ", err.message)
        res.status(500).json({message: err.message});
    }
}

module.exports.editCampgrounds = async (req, res) => {
    try {
        const campground = await CampgroundRoutes.findById(req.params.id)
        res.json({campground})
    } catch (err) {
        console.log("Error in campgrounds (edit): ", err.message)
        res.status(500).json({message: err.message});
    }
}

module.exports.updateCampgrounds = async (req, res) => {
    try {
        const geoData = await geocoder.forwardGeocode({
            query: req.body.location, limit: 1
        }).send()
        const {title, location, price, description} = req.body;
        const campground = await CampgroundRoutes.findByIdAndUpdate(req.params.id, {
            $set: {
                title, location, price, description
            }
        }, {new: true});
        campground.geometry = geoData.body.features[0].geometry
        const imgs = req.files.map(f => ({url: f.path, filename: f.filename}))
        campground.images.push(...imgs)
        await campground.save()
        if (req.body.deleteImages) {
            for (let filename of req.body.deleteImages) {
                await cloudinary.uploader.destroy(filename)
            }
            await campground.updateOne({$pull: {images: {filename: {$in: req.body.deleteImages}}}})
        }
        return res.status(200).json({message: 'Successfully Updated The Campground'});
    } catch (err) {
        console.log("Error in campgrounds (edit): ", err.message)
        res.status(500).json({message: err.message});
    }
}

module.exports.createCampgrounds = async (req, res) => {
    try {
        const geoData = await geocoder.forwardGeocode({
            query: req.body.location, limit: 1
        }).send()
        const campground = new CampgroundRoutes(req.body)
        campground.geometry = geoData.body.features[0].geometry
        campground.images = req.files.map(f => ({url: f.path, filename: f.filename}))
        // campground.createdAt = new Date();

        await campground.save();
        return res.status(200).json({message: 'Successfully Created A Campground', campground});
    } catch (err) {
        console.log("Error in campgrounds (adding new): ", err.message)
        res.status(500).json({message: err.message});
    }
}
