const mongoose = require('mongoose');
const {DateTime} = require('luxon');

const Schema = mongoose.Schema;

const AuthorSchema = new Schema({
    first_name : {type: String, required: true, maxLength : 100},
    family_name : {type: String, required: true, maxLength: 100},
    date_of_birth: Date,
    date_of_death: Date
});

AuthorSchema.virtual("name").get(function () {
    let fullname = "";
    if (this.first_name && this.family_name){
        fullname = `${this.family_name}, ${this.first_name}`;
    }
    return fullname;
});

AuthorSchema.virtual("url").get(function () {
    return `/catalog/author/${this._id}`;
});

AuthorSchema.virtual("birthdate_formatted").get(function() {
    return this.date_of_birth? DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED): "";
})

AuthorSchema.virtual("deathdate_formatted").get(function() {
    return this.date_of_death ? DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED): "";
})

AuthorSchema.virtual("birth_to_death").get(function() {
    dob = this.date_of_birth? DateTime.fromJSDate(this.date_of_birth).toLocaleString(DateTime.DATE_MED): "";
    dod = this.date_of_death ? DateTime.fromJSDate(this.date_of_death).toLocaleString(DateTime.DATE_MED): "";
    if (dob && dod){
        return dob + '-' + dod;
    }
    else if (dob && !dod) {
        return dob + '- Alive'; 
    }
    else return '';
})


module.exports = mongoose.model("Author", AuthorSchema);
