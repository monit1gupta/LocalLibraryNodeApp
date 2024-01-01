const Book = require("../models/book");
const Genre = require("../models/genre");
const Bookinstance = require("../models/bookInstance");
const Author = require("../models/author");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

//HOME PAGE
exports.index = asyncHandler(async (req, res, next) => {
  // Get details of books, book instances, authors and genre counts (in parallel)
  const [
    numBooks,
    numBookinstances,
    numBookinstancesAvailable,
    numGenres,
    numAuthors,
  ] = await Promise.all([
    Book.countDocuments({}).exec(),
    Bookinstance.countDocuments({}).exec(),
    Bookinstance.countDocuments({ status: "Available" }).exec(),
    Author.countDocuments({}).exec(),
    Genre.countDocuments({}).exec(),
  ]);
  res.render("index", {
    title: "Library Home Page",
    book_count: numBooks,
    bookinstance_count: numBookinstances,
    bookinstanceavailable_count: numBookinstancesAvailable,
    genre_count: numGenres,
    author_count: numAuthors,
  });
});

// Display list of all books.
exports.book_list = asyncHandler(async (req, res, next) => {
  const allBooks = await Book.find({}, "title author")
    .sort({ title: 1 })
    .populate("author") //this will replace the stored book author id with the full author details
    .exec();

  res.render("book_list", { title: "All Books", book_list: allBooks });
});

// Display detail page for a specific book.
exports.book_detail = asyncHandler(async (req, res, next) => {
  const bookData = await Book.findById({ _id: req.params.id })
    .populate("author")
    .populate("genre")
    .exec();
  const bookInstances = await Bookinstance.find({ book: req.params.id }).exec();
  if (bookData === null) {
    const err = new Error("Book not found.");
    err.status = 404;
    return next(err);
  }
  res.render("book_detail", {
    title: "Book Details",
    bd: bookData,
    bd_ins: bookInstances,
  });
});

// Display book create form on GET.
exports.book_create_get = asyncHandler(async (req, res, next) => {
  const [allAuthors, allGenres] = await Promise.all([
    Author.find({}).sort({ first_name: 1 }).exec(),
    Genre.find({}).sort({ name: 1 }).exec(),
  ]);

  res.render("book_form", {
    title: "Create Book",
    authors: allAuthors,
    genres: allGenres,
  });
});

// Handle book create on POST.
exports.book_create_post = [
  // Convert the genre to an array.
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre =
        typeof req.body.genre === "undefined" ? [] : [req.body.genre];
    }
    next();
  },

  // Validate and sanitize fields.
  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Summary must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
    });
    if (!errors.isEmpty()) {
      const [allAuthors, allGenres] = await Promise.all([
        Author.find({}).sort({ first_name: 1 }).exec(),
        Genre.find({}).sort({ name: 1 }).exec(),
      ]);
      for (const genre of allGenres) {
        if (book.genre.includes(genre._id)) {
          genre.checked = "true";
        }
      }
      res.render("book_form", {
        title: "Create Book",
        book: book,
        genres: allGenres,
        authors: allAuthors,
      });
    } else {
      await book.save();
      res.redirect(book.url);
    }
  }),
];

// Display book delete form on GET.
exports.book_delete_get = asyncHandler(async (req, res, next) => {
  const bookData = await Book.findById({ _id: req.params.id })
    .populate("author")
    .populate("genre")
    .exec();
  const bookInstances = await Bookinstance.find({ book: req.params.id }).exec();
  if (bookData === null) {
    const err = new Error("Book not found.");
    err.status = 404;
    return next(err);
  }
  res.render("book_delete_form", {
    title: "Delete Book",
    book: bookData,
    book_instances: bookInstances,
  });
});

// Handle book delete on POST.
exports.book_delete_post = asyncHandler(async (req, res, next) => {
  const [book, bookinstances] = await Promise.all([
    Book.findById(req.params.id).exec(),
    Bookinstance.find({ book: req.params.id }).exec(),
  ]);
  if (bookinstances.length > 0) {
    res.render("book_delete_form", {
      title: "Delete Book",
      book: book,
      book_instances: bookinstances,
    });
  }
  await Book.findByIdAndDelete(req.params.id);
  res.redirect("/catalog/books");
});

// Display book update form on GET.
exports.book_update_get = asyncHandler(async (req, res, next) => {
  const [book, allAuthors, allGenres] = await Promise.all([
    Book.findById(req.params.id).populate("author").exec(),
    Author.find({}).sort({ first_name: 1 }).exec(),
    Genre.find({}).sort({ name: 1 }).exec(),
  ]);
  if (book === null) {
    const err = new Error("Book not found");
    err.status = 404;
    return next(err);
  }
  allGenres.forEach((genre) => {
    if (book.genre.includes(genre._id)) genre.checked = "true";
  });
  res.render("book_form", {
    title: "Update Book",
    book: book,
    authors: allAuthors,
    genres: allGenres,
  });
});

// Handle book update on POST.
exports.book_update_post = [
  // Convert the genre to an array.
  (req, res, next) => {
    if (!Array.isArray(req.body.genre)) {
      req.body.genre =
        typeof req.body.genre === "undefined" ? [] : [req.body.genre];
    }
    next();
  },

  // Validate and sanitize fields.
  body("title", "Title must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("author", "Author must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("summary", "Summary must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
      _id: req.params.id,
    });
    if (!errors.isEmpty()) {
      const [allAuthors, allGenres] = await Promise.all([
        Author.find({}).sort({ first_name: 1 }).exec(),
        Genre.find({}).sort({ name: 1 }).exec(),
      ]);
      for (const genre of allGenres) {
        if (book.genre.includes(genre._id)) {
          genre.checked = "true";
        }
      }
      res.render("book_form", {
        title: "Update Book",
        book: book,
        genres: allGenres,
        authors: allAuthors,
        errors: errors,
      });
      return;
    } else {
      const updatedBook = await Book.findByIdAndUpdate(req.params.id, book, {});
      res.redirect(updatedBook.url);
    }
  }),
];
