const express = require('express')
const router = express.Router()

const multer = require('multer')
const {storage} = require('../cloudinary')
const upload = multer({storage})

const campgroundsController = require("../controllers/campgroundsController");

const catchAsync = require("../utils/catchAsync");
const {isAuthor, validateCampground} = require("../middleware");

router.route('/')
    .get(catchAsync(campgroundsController.showCampgrounds))

router.route('/:id')
    .get(catchAsync(campgroundsController.showCampgroundsById))
    .delete(isAuthor, catchAsync(campgroundsController.deleteCampgrounds))

router.route('/:id/edit')
    .get(isAuthor, catchAsync(campgroundsController.editCampgrounds))
    .post(upload.array('image'), validateCampground, isAuthor, catchAsync(campgroundsController.updateCampgrounds))

router.route('/new')
    .post(upload.array('image'), validateCampground, catchAsync(campgroundsController.createCampgrounds))

module.exports = router;