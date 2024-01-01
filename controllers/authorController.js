const Author = require("../models/author");
const Book = require("../models/book");
const { body, validationResult } = require("express-validator");

//Handles exceptions in route functions
const asyncHandler = require("express-async-handler");

//display list of all authors
exports.author_list = asyncHandler(async (req, res, next) => {
  const Authors = await Author.find({}).exec();
  res.render("author_list", { title: "Authors", author_list: Authors });
});

//display details page for a specific author
exports.author_detail = asyncHandler(async (req, res, next) => {
  const [authorDetail, bookList] = await Promise.all([
    Author.find({ _id: req.params.id }).exec(),
    Book.find({ author: req.params.id }).populate("genre").exec(),
  ]);
  if (authorDetail === null) {
    const err = new Error("Author not found");
    err.status = 404;
    return next(err);
  }
  res.render("author_details", {
    title: "Author Details",
    author: authorDetail[0],
    auth_book: bookList,
  });
});

// Display Author create form on GET.
exports.author_create_get = asyncHandler(async (req, res, next) => {
  res.render("author_form", { title: "Create Author" });
});

// Handle Author create on POST.
exports.author_create_post = [
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("first name Cannot be empty")
    .isAlpha()
    .withMessage("first name Should contain Alphabets only"),

  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("family name Cannot be Empty")
    .isAlpha()
    .withMessage("family name Should contain Alphabets only"),

  body("date_of_birth", "Invalid Date")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  body("date_of_death", "Invalid Date")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
    });

    if (!errors.isEmpty()) {
      res.render("author_form", {
        title: "Create Author",
        author: author,
        errors: errors.array(),
      });
      return;
    } else {
      await author.save();
      res.redirect(author.url);
    }
  }),
];

// Display Author delete form on GET.
exports.author_delete_get = asyncHandler(async (req, res, next) => {
  const [author, allBooks] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }).exec(),
  ]);
  if (author === null) {
    res.redirect("/catalog/authors");
  }
  res.render("author_delete_form", {
    title: "Delete Author",
    author: author,
    books: allBooks,
  });
});

// Handle Author delete on POST
exports.author_delete_post = asyncHandler(async (req, res, next) => {
  const [author, allBooks] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }).exec(),
  ]);
  if (allBooks.length > 0) {
    res.render("author_delete_form", {
      title: "Delete Author",
      author: author,
      books: allBooks,
    });
  }
  await Author.findByIdAndDelete(req.params.id);
  res.redirect("/catalog/authors");
});

// Display Author update form on GET.
exports.author_update_get = asyncHandler(async (req, res, next) => {
  const author = await Author.findById(req.params.id).exec();
  res.render("author_form", {
    title: "Update Author",
    author: author,
    dob: author.date_of_birth,
  });
});

// Handle Author update on POST.
exports.author_update_post = [
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("first name Cannot be empty")
    .isAlpha()
    .withMessage("first name Should contain Alphabets only"),

  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("family name Cannot be Empty")
    .isAlpha()
    .withMessage("family name Should contain Alphabets only"),

  body("date_of_birth", "Invalid Date")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  body("date_of_death", "Invalid Date")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      res.render("author_form", {
        title: "Update Author",
        author: author,
        errors: errors.array(),
      });
      return;
    } else {
      await Author.findByIdAndUpdate(req.params.id, author, {});
      res.redirect(author.url);
    }
  }),
];
