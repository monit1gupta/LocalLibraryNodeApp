const Genre = require("../models/genre");
const Book = require("../models/book");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

//show all genres
exports.genre_list = asyncHandler(async (req, res, next) => {
  const allGenres = await Genre.find({}).exec();
  res.render("genre_list", { title: "Genres", genre_list: allGenres });
});

// Display detail page for a specific Genre.
exports.genre_detail = asyncHandler(async (req, res, next) => {
  const [GenreSelected, BooksInGenre] = await Promise.all([
    Genre.findById({ _id: req.params.id }, "name").exec(),
    Book.find({ genre: req.params.id }, "title summary").exec(),
  ]);

  if (GenreSelected === null) {
    const err = new Error("genre not found");
    err.status = 404;
    return next(err);
  }
  res.render("genre_details", {
    genre_sel: GenreSelected,
    book_gen_list: BooksInGenre,
  });
});

// Display Genre create form on GET.
exports.genre_create_get = asyncHandler(async (req, res, next) => {
  res.render("genre_form", { title: "Create Genre" });
});

// Handle Genre create on POST.
exports.genre_create_post = [
  // Validate and sanitize the name field.
  body("name", "name must be atleast 3 characters long")
    .trim()
    .isLength({ min: 3 })
    .escape(), //helps against cross-site-scripting

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    //collect the errors
    const errors = validationResult(req);

    //create new genre obj with trimmed and escaped data
    const genre = new Genre({ name: req.body.name });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("genre_form", {
        title: "Create Genre",
        genre: genre,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      const genreExists = await Genre.findOne({ name: genre.name })
        .collation({ locale: "en", strength: 2 })
        .exec();
      if (genreExists) {
        res.redirect(genreExists.url);
      } else {
        await genre.save();
        res.redirect(genre.url);
      }
    }
  }),
];

// Display Genre delete form on GET.
exports.genre_delete_get = asyncHandler(async (req, res, next) => {
  const [genre, allBooks] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }).populate("author").populate("genre").exec(),
  ]);
  if (genre === null) {
    const err = new Error("Genre not found");
    err.status = 404;
    return next(err);
  }
  res.render("genre_delete_form", {
    title: "Delete Genre",
    genre: genre,
    books: allBooks,
  });
});

// Handle Genre delete on POST.
exports.genre_delete_post = asyncHandler(async (req, res, next) => {
  const [genre, allBooks] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }).populate("author").populate("genre").exec(),
  ]);
  if(allBooks.length > 0){
    alert("delete all assoicated books before deleting the genre!");
    res.redirect('/catalog/genres');
  }
  await Genre.findByIdAndDelete(req.params.id);
  res.redirect('/catalog/genres');
});

// Display Genre update form on GET.
exports.genre_update_get = asyncHandler(async (req, res, next) => {
  const genre = await Genre.findById(req.params.id).exec();
  res.render("genre_form", {title:"Update Genre", genre:genre});
});

// Handle Genre update on POST.
exports.genre_update_post = [
  // Validate and sanitize the name field.
  body("name", "name must be atleast 3 characters long")
    .trim()
    .isLength({ min: 3 })
    .escape(), //helps against cross-site-scripting

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    //collect the errors
    const errors = validationResult(req);

    //create new genre obj with trimmed and escaped data
    const genreUpdate = new Genre({ name: req.body.name, _id: req.params.id });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("genre_form", {
        title: "Update Genre",
        genre: genreUpdate,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      const genreExists = await Genre.findOne({ name: genreUpdate.name })
        .collation({ locale: "en", strength: 2 })
        .exec();
      if (genreExists) {
        res.redirect(genreExists.url);
      } else {
        await Genre.findByIdAndUpdate(req.params.id, genreUpdate, {});
        res.redirect(genreUpdate.url);
      }
    }
  }),
];