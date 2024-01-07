require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express')
const app = express();
const cors = require('cors');
const session = require('express-session')
const mongoSanitize = require('express-mongo-sanitize')
const helmet = require('helmet')
const {MongoClient, ServerApiVersion} = require('mongodb');

const passport = require("passport");
const LocalStrategy = require('passport-local')
const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/yelp-camp";

const User = require('./models/userModel')
const campgroundRoutes = require('./routes/campgroundRoutes')
const reviewRoutes = require('./routes/reviewsRoutes')
const userRoutes = require('./routes/usersRoutes')


const secret = process.env.SECRET || 'thisshouldbeabettersecret!';

app.use(mongoSanitize({replaceWith: '_'}))
app.use(helmet())
app.use(express.json());
app.use(session({secret, resave: false, saveUninitialized: true}))

app.use(cors({
    origin: 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

const scriptSrcUrls = ['https://stackpath.bootstrapcdn.com/', 'https://api.tiles.mapbox.com/', 'https://api.mapbox.com/', 'https://kit.fontawesome.com/', 'https://cdnjs.cloudflare.com/', 'https://cdn.jsdelivr.net/'];
const styleSrcUrls = ['https://kit-free.fontawesome.com/', 'https://stackpath.bootstrapcdn.com/', 'https://api.mapbox.com/', 'https://api.tiles.mapbox.com/', 'https://fonts.googleapis.com/', 'https://use.fontawesome.com/', 'https://cdn.jsdelivr.net/'];
const connectSrcUrls = ['https://api.mapbox.com/', 'https://a.tiles.mapbox.com/', 'https://b.tiles.mapbox.com/', 'https://events.mapbox.com/'];
const fontSrcUrls = [];

app.use(helmet.contentSecurityPolicy({
    directives: {
        defaultSrc: ["'self"],
        connectSrc: ["'self'", ...connectSrcUrls],
        scriptSrc: ["'self'", ...scriptSrcUrls],
        styleSrc: ["'self'", ...styleSrcUrls],
        workerSrc: ["'self'", 'blob:'],
        objectSrc: ["'none"],
        imgSrc: ["'self'", 'blob:', 'data:', 'https://res.cloudinary.com/', 'https://images.unsplash.com/', 'https://source.unsplash.com/'],
        fontSrc: ["'self'", ...fontSrcUrls]
    }
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


mongoose.connect(uri).then(() => {
    console.log('Connected to MongoDB');
}).catch((err) => {
    console.error('Error connecting to MongoDB:', err);
});

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1, strict: true, deprecationErrors: true,
    }
});

async function run() {
    try {
        await client.connect();
        await client.db("admin").command({ping: 1});
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        await client.close();
    }
}

run().catch(console.dir);

app.use('/campgrounds', campgroundRoutes)
app.use('/campgrounds/:id/reviews', reviewRoutes)
app.use('/', userRoutes)

app.listen(3000, () => {
    console.log('Serving on port 3000')
})

