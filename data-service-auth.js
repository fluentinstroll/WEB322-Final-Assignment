/*temp*/
const bcrypt = require("bcryptjs");
var mongoose = require("mongoose");
var Schema = mongoose.Schema;
var userSchema = new Schema({
    "userName": {
        type: String,
        unique: true
    },
    "password": String,
    "email": String,
    "loginHistory": [{
        "dateTime": Date,
        "userAgent": String
    }],
});

let User; // defined in initialize

module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        console.log("dataAuth Intialized");
        let db = mongoose.createConnection("mongodb://rcrambo:lucas12claus@ds127842.mlab.com:27842/web322_a6");
        db.on('error', (err) => {
            reject(err); // reject the promise with the provided error
        });
        db.once('open', () => {
            User = db.model("users", userSchema);
            resolve();
        });
    });
}

module.exports.registerUser = function (userData) {
    return new Promise((resolve, reject) => {
        if (userData.password !== userData.password2)
            reject('Passwords do not match');

        bcrypt.genSalt(10, (err, salt) => { // encrypt password
            bcrypt.hash(userData.password, salt, (err, hash) => {
                if (err)
                    reject('There was an error encrypting the password');
                userData.password = hash;
            })
        })
        /** create newUser (username) and save it */
        let newUser = new User(userData);

        newUser.save((err) => {
            if (err && err.code === 11000)
                reject('User Name already taken');
            else if (err && err.code !== 11000)
                reject('There was an error creating the user: ' + err);
            else
                resolve();
        });
    });
}

module.exports.checkUser = function (userData) {
    return new Promise(function (resolve, reject) {
        User.find({
                userName: userData.userName
            })
            .exec()
            .then((user) => {
                bcrypt.compare(userData.password, user[0].password)
                    .then((res) => {
                        user[0].loginHistory.push({
                            dateTime: (new Date()).toString(),
                            userAgent: userData.userAgent
                        });
                        User.update({
                                userName: user[0].userName
                            }, {
                                $set: {
                                    loginHistory: user[0].loginHistory
                                }
                            }, {
                                multi: false
                            })
                            .exec()
                            .then(() => {
                                resolve(user[0]);
                            })
                            .catch((err) => {
                                reject("There was an error verifying the user: " + err);
                            });
                    })
                    .catch((err) => {
                        reject("Incorrect Password for user: " + userData.userName);
                    })
            })
            .catch((err) => {
                reject("Unable to find user: " + userData.userName);
            });
    });
}