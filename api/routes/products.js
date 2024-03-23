const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, new Date().toISOString() + file.originalname);
  },
});

const fileFilter = (req, file, cb) => {
  // accept id image and reject if not
  if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    // fileSize: 1024 * 1024 * 5, // declaring file size to 5 MB
  },
  fileFilter: fileFilter,
});

const Product = require("../models/product");

// Route - 1 : '/products' --> GET method
router.get("/", (req, res, next) => {
  Product.find()
    // .select("name price _id")
    .exec()
    .then((docs) => {
      const products = {
        total: docs.length,
        message: "Fetched all documents",
        products: docs.map((doc) => {
          return {
            name: doc.name,
            price: doc.price,
            id: doc._id,
            productImage: doc.productImage,
            request: {
              type: "GET",
              url: "http://localhost/products/" + doc._id,
            },
          };
        }),
      };
      res.status(200).json(products);
    })
    .catch((err) => res.status(500).json({ error: err }));
});

// Route - 2 : '/products' --> POST method
router.post("/", upload.single("productImage"), (req, res, next) => {
  console.log(req.file);
  const product = new Product({
    _id: new mongoose.Types.ObjectId(),
    name: req.body.name,
    price: req.body.price,
    productImage: req.file.path,
  });
  product
    .save()
    .then((doc) =>
      res.status(201).json({
        message: "Created product Successfully",
        product: {
          name: doc.name,
          price: doc.price,
          id: doc._id,
          productImage: req.file.path,
          request: {
            type: "POST",
            url: "http://localhost/products/" + doc._id,
          },
        },
      })
    )
    .catch((err) => res.status(500).json({ error: err.message }));
});

// Route - 3 : '/products/:productId' --> GET method
router.get("/:productId", (req, res, next) => {
  const id = req.params.productId;
  Product.findById(id)
    .exec()
    .then((doc) => {
      if (doc) {
        res.status(200).json({
          message: "product Found",
          product: {
            name: doc.name,
            price: doc.price,
            id: doc._id,
            productImage: doc.productImage,
            request: {
              type: "GET",
              url: "http://localhost/products/" + doc._id,
            },
          },
        });
      } else {
        res.status(404).json({ error: "Product Not Found" });
      }
    })
    .catch((err) => res.status(500).json({ error: err }));
});

// Route - 4 : '/products/:productId' --> PATCH method
router.patch("/:productId", (req, res, next) => {
  const id = req.params.productId;
  const bodyProduct = {};
  for (const element of req.body) {
    bodyProduct[element.propName] = element.value;
  }
  Product.updateOne({ _id: id }, { $set: bodyProduct })
    .exec()
    .then(() =>
      res.status(200).json({
        message: "product updated successfully",
        product: {
          request: {
            type: "PATCH",
            url: "http://localhost/products/" + id,
          },
        },
      })
    )
    .catch((err) => res.status(500).json({ error: err }));
});

// Route - 5 : '/products/:productId' --> DELETE method
router.delete("/:productId", (req, res, next) => {
  let id = req.params.productId;
  Product.deleteOne({ _id: id })
    .then((doc) =>
      res.status(200).json({
        message: "deleted successfully",
        product: {
          request: {
            type: "DELETE",
            url: "http://localhost/products/" + id,
          },
        },
      })
    )
    .catch((err) => res.status(500).json({ error: err }));
});

module.exports = router;
