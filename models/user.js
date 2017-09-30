var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var bcrypt = require('bcryptjs');
var userSchema = new Schema({
    email: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    password: { type: String },
    role: {
        type: Schema.ObjectId,
        ref: 'Role',
        required: true
    }
});
userSchema.pre('save', function (next) {
    console.log('in save pre: ' + this);
    var user = this;
    if (this.isModified('password') || this.isNew) {
        bcrypt.genSalt(10, function (err, salt) {
            if (err) {
                console.log('in bcrypt.genSalt: ' + err);
                return next(err);
            }
            bcrypt.hash(user.password, salt, function (err, hash) {
                if (err) {
                    console.log('in  bcrypt.hash: salt= ' + salt + ' err= ' + err);
                    return next(err);
                }
                user.password = hash;
                next();
            });
        });
    } else {
        return next();
    }
});
userSchema.methods.compareHashed = function (password, cb) {
    console.log('compare passwords: \n' + this.password + '\n' + password);
    if (password === this.password) {
        console.log('compareHashed going back good');
        cb(null, true);
    }
    console.log('compareHashed going back bad');
    return cb(err);
}
userSchema.methods.comparePassword = function (passw, cb) {
    console.log('compare this: ' + this);
    console.log('compare passwords: \n' + this.password + '\n' + passw);
    bcrypt.compare(passw, this.password, function (err, isMatch) {
        console.log('compare isMatch: ' + isMatch + ' err ' + err);
        if (err) {
            return cb(err);
        }
        cb(null, isMatch);
    });
};
userSchema.methods.setPassword = function (password, cb) {
    console.log('setting password');
    if (!password) {
        console.log('no password');
        return cb(new BadRequestError(options.missingPasswordError));
    }

    var self = this;

    crypto.randomBytes(options.saltlen, function (err, buf) {
        if (err) {
            console.log('randomBytes err');
            return cb(err);
        }

        var salt = buf.toString('hex');
        console.log('after salt');
        crypto.pbkdf2(password, salt, options.iterations, options.keylen, function (err, hashRaw) {
            if (err) {
                console.log('pbkdf2 error');
                return cb(err);
            }

            self.set(options.hashField, new Buffer(hashRaw, 'binary').toString('hex'));
            self.set(options.saltField, salt);

            cb(null, self);
        });
    });
};
var User = mongoose.model('User', userSchema);
module.exports = User;
