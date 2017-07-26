var express = require('express');
var server = express();

server.use(express.static(__dirname + '/client'));

server.set('port', process.env.PORT || 7000);

// ========================= mongoose =========================
var mongoose = require('mongoose');
var dbURI = 'mongodb://localhost/page';
if (process.env.NODE_ENV === 'production') {
	dbURI = process.env.MONGOLAB_URI;
}

mongoose.connect(dbURI);

mongoose.connection.on('connected', function () {
	console.log('Mongoose connected to ' + dbURI);
});
mongoose.connection.on('error', function (error) {
	console.log('Mongoose connection error: ' + error);
});
mongoose.connection.on('disconnected', function () {
	console.log('Mongoose disconnected');
});

var gracefulShutdown = function (message, callback) {
	mongoose.connection.close(function () {
		console.log('Mongoose is disconnected through ' + message);
		callback();
	});
};
process.once('SIGUSR2', function () {
	gracefulShutdown('nodemon restart', function () {
		process.kill(process.pid, 'SIGUSR2');
	});
});
// ============================================================ 




// ====================== authentication ====================== 
var userSchema = new mongoose.Schema({
	email: { type: String, unique: true, required: true },
	username: { type: String, unique: true, required: true },
	name: { type: String, unique: false, required: true },
	hash: String,
	salt: String
});

// import crypto for password encryption
var crypto = require('crypto');

userSchema.methods.setPassword = function (password) {
	// save password as a salt and hash - this is a one-way encryption
	this.salt = crypto.randomBytes(16).toString('hex');
	this.hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha1').toString('hex');
};
userSchema.methods.checkPassword = function (password) {
	// passwords are checked by applying the same one-way encryption then comparing the hash
	var hash = crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha1').toString('hex');
	return this.hash === hash;
};


// import jsonwebtoken for securely relying data to client
var jwt = require('jsonwebtoken');

userSchema.methods.generateJwt = function () {
	var exp = new Date();
	exp.setDate(exp.getDate() + 7);

	return jwt.sign({
		_id: this._id,
		email: this.email,
		username: this.username,
		name: this.name,
		exp: parseInt(exp.getTime() / 1000)	
	}, "IEB");
};

// set model of user
mongoose.model('User', userSchema);
var User = mongoose.model('User');

// insert dummy user data
// User.findOne({username: 'bbrewer'}, function (error, user) {
// 	if (error) {
// 		console.log(error);
// 	}
// 	if (user !== null) {
// 		user.remove(function (error, user) {
// 			if (error) {console.log(error);}
// 			console.log('deleted user: ', user);
// 		});
// 	}
// });
// var userBen = new User({
// 	email: 'benbrewerbowman@gmail.com',
// 	username: 'bbrewer',
// 	name: 'Ben'
// });
// userBen.setPassword('f0cUS6rO');
// userBen.save(function (error, userBen) {
// 	if (error) {console.log(error);}
// 	console.log(userBen);
// });



// import passport for authentication process
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;

// authentication process?
passport.use(new LocalStrategy(
	function (username, password, done) {
		User.findOne({ username: username }, function (error, user) {
			if (error) { return done(error); }
			if (!user) { return done(null, false, {message: 'User not found'}); }
			if (!user.checkPassword(password)) { return done(null, false, {message: 'Password is incorrect'}); }
			return done(null, user);
		});
	}
));



// login api controller???
var login = function (request, response) {
	passport.authenticate('local', function (error, user, info) {
		var token;
		// if error occurs within passport
		if (error) {
			console.log('Login error: \n', error);
			response.status(404).json(error); return; 
		}
		// if a user is found
		if (user) {
			token = user.generateJwt();
			console.log('Login good, jwt: \n', token);
			response.status(200).json({ "token": token });
		} else { // if a user is not found
			console.log('Login user not found: \n', info);
			response.status(401).json(info);
		}
	})(request, response);
};



// profile controller???
var loadProfile = function (request, response) {
	if (!request.payload._id) {
		response.status(401).json({ "message": "Unauthorized!"});
	} else {
		User.findById(request.payload._id).exec(function (error, user) {
			response.status(200).json(user);
		});
	}
};



// i took out this functionality of recieving user info as a jwt, 
// let's see if we can get that back in.
var ejwt = require('express-jwt');
var auth = ejwt({
	secret: "IEB",
	userProperty: 'payload'
}); 

// body parser
var bodyParser = require('body-parser');
server.use(bodyParser.json());

// authentication routes
server.get('/manage', function (request, response) {
	console.log('responding to getting /manage');
	response.json({message: "welcome"});
});
server.post('/manage', function (request, response) {
	console.log(request.body);
	login(request, response);
});
// ============================================================ 




// ======================= Page Data ========================== 
var pageSchema = new mongoose.Schema({
	name: { type: String, unique: true, required: true },
	sections: [{
		name: { type: String, unique: false, required: true },
		title: { type: String, unique: false, required: false },
		// TODO: deal with the size limit for description strings
		// SOLVED: ran mongod with --setParameter failIndexTooLong=false
		description: { type: String, unique: false, required: false },
		// idk if this will work.
		notes: [{ type: String, unique: false, required: false }],
		// idk if this will work.
		list: [{ type: String, unique: false, required: false }],
		// let's figure image out first...
		// table: { type: Boolean, unique: false, required: false },
		images: [{ type: Boolean, unique: false, required: false }],
		html: { type: String, unique: false, require: false }
	}]
});
mongoose.model('Page', pageSchema);
var Page = mongoose.model('Page');


// insert dummy page data
// Page.findOne({name: 'Homepage'}, function (error, page) {
// 	if (error) {
// 		console.log(error);
// 	}
// 	if (page !== null) {
// 		page.remove(function (error, page) {
// 			if (error) {console.log(error);}
// 			console.log('deleted page: ', page);
// 		});
// 	} else{
// 		console.log('homepage doesn\'t exist');
// 		return;
// 	}
// });
// var homepage = new Page({
// 	name: 'Homepage',
// 	sections: [
// 		{
// 			name: 'Headline',
// 			title: 'WEEKI WACHEE KAYAKING'
// 		},
// 		{
// 			name: 'Slideshow',
// 			images: true
// 		},
// 		{
// 			name: 'Welcome',
// 			title: 'Welcome to Weeki Wachee Kayaking!',
// 			description: 'Our goal at Weeki Wachee Kayaking is to provide you with an incredible, hassle-free experience on the beautiful waters of Weeki Wachee River. The exceptionally crystal clear water of the Weeki Wachee River allows our guests to see a variety of marine life. Manatee are the main attraction on the river and provide a once in a lifetime for some to see the majestic animals as they traverse the river. We offer kayak and canoe rentals, which include other necessary equipment, and we are the only company that offers multiple launch and pick up points on the Weeki Wachee River. We have a private lauching/landing area where you can park your vehicle and we can transport you back and forth as necessary. We can work with you in advance to plan out unique tours and special events based on you or your group\'s needs and requirements. blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah blah'
// 		},
// 		{
// 			name: 'Rentals Overview',
// 			title: 'RENTALS',
// 			description: 'We offer kayak and canoe rentals, which include other necessary equipment, and we are the only company that offers multiple launch and pick up points on the Weeki Wachee River.',
// 			images: true	
// 		},
// 		{
// 			name: 'Tours Overview',
// 			title: 'TOURS',
// 			description: 'We can work with you in advance to plan out unique tours. Manatee are the main attraction on the river and provide a once in a lifetime for some to see the majestic animals as they traverse the river.',
// 			images: true
// 		},
// 		{
// 			name: 'Special Events Overview',
// 			title: 'SPECIAL EVENTS',
// 			description: 'We can also work with you to plan special events based on you or your groups needs and requirements. From kayak racing to scavenger hunts to birthday parties, we want to make your time on the river as hassle-free as possible.',
// 			images: true
// 		},
// 		{
// 			name: 'Hours of Operation',
// 			title: 'HOURS OF OPERATION',
// 			opening: 8, // i don't like how this is formatted
// 			closing: 6, // i don't like how this is formatted
// 			description: '3 PM is the latest that the state park allows launches. Please call in advance if planning a late afternoon (after 2 PM) launch.'
// 		}
// 	]
// });
// homepage.save(function (error, page) {
// 	if (error) {console.log('error saving homepage', error);}
// 	else {console.log('homepage saved');}
// });
// Page.findOne({name: 'River Page'}, function (error, page) {
// 	if (error) {
// 		console.log(error);
// 	}
// 	if (page !== null) {
// 		page.remove(function (error, page) {
// 			if (error) {console.log(error);}
// 			console.log('deleted page: ', page);
// 		});
// 	} else{
// 		console.log('riverpage doesn\'t exist');
// 		return;
// 	}
// });
// var riverpage = new Page({
// 	name: 'River Page',
// 	sections: [
// 		{
// 			name: 'Headline',
// 			title: 'SAVE A MANATEE, RIDE A KAYAK'

// 		},
// 		{
// 			name: 'Clear Waters',
// 			title: 'CRYSTAL CLEAR WATERS',
// 			description: 'The Weeki Wachee River is a spring fed river and is a magnitude 1 spring. The spring produces 67 Million Gallons of crystal clear water every day. This crystal clear water flows downstream to the Gulf of Mexico and makes the river one of the most beautiful rivers in the U.S.. Depths on the river range from 1 - 12 feet on average. There are some deeper areas on the river but the majority of the river is shallow which makes it perfect for seeing all the marine life.',
// 			images: true
// 		},
// 		{
// 			name: 'Hospital Hole',
// 			title: 'FABLED HOSPITAL HOLE',
// 			description: 'Hospital Hole is located ¼ mile down river from Weeki Wachee Kayaking and is a favorite diving spot for cave divers. (Cave diving should only be done by certified cave divers). The dive is considered an advanced cave dive as there is an extensive underwater cavern system. The hole is also fabled to have a special curing power for fish and fish travel from all over to come to the hole to recuperate.',
// 			images: true
// 		},
// 		{
// 			name: 'Marine Life',
// 			title: 'MARINE LIFE',
// 			description: 'The exceptionally crystal clear water of the Weeki Wachee River allows our guests to see a variety of marine life. Manatee are the main attraction on the river and provide a once in a lifetime for some to see the majestic animals as they traverse the river.In the Weeki Wachee River you will see a variety of fresh water fish including mullet, bluegill, bass, freshwater gar and a variety of other freshwater fish. Turtles and otters can be seen as you travel down the slow winding river with an occasional deer sighting mixed into your trip.',
// 			images: true
// 		},
// 		{
// 			name: 'Weeki Wachee State Park',
// 			title: 'WEEKI WACHEE STATE PARK',
// 			description: 'Since 1947 Weeki Wachee Springs State Park has amazed the world by introducing them to Mermaids. Young and not-so-young alike have enjoyed the attraction since 1947 when Newton Perry opened the attraction to the general public. Perry had trained US Navy Seals in World War 2 and in 1947, 2 years after the war ended, opened Weeki Wachee as a roadside attraction. Currently the attraction is owned by the State Park Service.',
// 			images: true
// 		}

// 	]
// });
// riverpage.save(function (error, page) {
// 	if (error) {console.log('error saving riverpage', error);}
// 	else {console.log('riverpage saved');}
// });


// route
server.get('/manage/pages', function (request, response) {
	Page.find({}, function (error, pages) {
		if (!error) {
			response.status(200);
			response.json(pages);
		} else {
			console.log('error with /manage/pages', error);
		}
	});
});



// ============================================================ 




// ========================== routes ==========================
// var router = express.Router();
// var bodyParser = require('body-parser');
// server.use(bodyParser.json());

// server.get('/page', function (request, response) {
// 	Page.find({}, function (error, pages) {
// 		if (!error) {
// 			response.status(200);
// 			response.json(pages);
// 		} else {
// 			throw error;
// 		}
// 	});
// });
// ============================================================






server.listen(server.get('port'), function () {
	console.log('Express server listening at port ' + server.get('port'));
});