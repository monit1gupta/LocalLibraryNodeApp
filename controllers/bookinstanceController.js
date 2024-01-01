const Bookinstance = require("../models/bookInstance");
const Book = require("../models/book");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

//display list of all book instances
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
  const bookinstanceData = await Bookinstance.find({}).populate("book").exec();

  res.render("bookinstance_list", {
    title: "Book Instance List",
    bookinstance_list: bookinstanceData,
  });
});

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
  const [biDetail] = await Promise.all([
    Bookinstance.findById(req.params.id).populate("book").exec(),
  ]);
  if (biDetail === null) {
    const err = new Error("Book instance not found.");
    err.status = 404;
    return next(err);
  }
  res.render("bi_details", { bi: biDetail });
});

// Display BookInstance create form on GET.
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
  const allBooks = await Book.find({}).sort({ title: 1 }).exec();
  res.render("bi_form", { title: "Create Bookinstance", books: allBooks });
});

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  body("book", "Book cannot be empty").trim().isLength({ min: 1 }).escape(),
  body("status").escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("due_back", "Invalid date")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const bookinstance = new Bookinstance({
      book: req.body.book,
      status: req.body.status,
      dueback: req.body.dueback,
      imprint: req.body.imprint,
    });

    if (!errors.isEmpty()) {
      const allBooks = await Book.find({}).sort({ title: 1 }).exec();
      res.render("bi_form", {
        title: "Create Bookinstance",
        books: allBooks,
        bi: bookinstance,
        selected_book: bookinstance._id,
        errors: errors,
      });
    } else {
      await bookinstance.save();
      res.redirect(bookinstance.url);
    }
  }),
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
  const biDetials = await Bookinstance.findById(req.params.id)
    .populate("book")
    .exec();
  if (biDetials === null) {
    const err = new Error("book instance not found");
    err.status = 404;
    return next(err);
  }
  res.render("bi_delete_form", {
    title: "Delete Bookinstance",
    bookinstance: biDetials,
  });
});

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
  const bookinstance = await Bookinstance.findById(req.params.id);
  if (bookinstance.status != "Available") {
    alert("Book could not be deleted, as it is not available");
    res.redirect("/catalog/bookinstances/");
  }
  await Bookinstance.findByIdAndDelete(req.params.id);
  res.redirect("/catalog/bookinstances/");
});

// Display BookInstance update form on GET.
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
  const [allBooks, bookinstance] = await Promise.all([
    Book.find({}).sort({ title: 1 }).exec(),
    Bookinstance.findById(req.params.id).exec(),
  ]);
  res.render("bi_form", { title: "Update Bookinstance", books: allBooks, book_instance: bookinstance, selected_book: Bookinstance.book});
});

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  body("book", "Book cannot be empty").trim().isLength({ min: 1 }).escape(),
  body("status").escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("due_back", "Invalid date")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const bookinstance = new Bookinstance({
      book: req.body.book,
      status: req.body.status,
      dueback: req.body.dueback,
      imprint: req.body.imprint,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      const allBooks = await Book.find({}).sort({ title: 1 }).exec();
      res.render("bi_form", {
        title: "Update Bookinstance",
        books: allBooks,
        bi: bookinstance,
        selected_book: bookinstance._id,
        errors: errors,
      });
    } else {
      await Bookinstance.findByIdAndUpdate(req.params.id, bookinstance, {});
      res.redirect(bookinstance.url);
    }
  }),
];
