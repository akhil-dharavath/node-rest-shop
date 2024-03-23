const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();

const Order = require("../models/order");
const product = require("../models/product");

// Route - 1 : '/orders' --> GET method
router.get("/", (req, res, next) => {
  Order.find({})
  .populate('product','name')
    .then((docs) =>
      res.status(200).json({
        total: docs.length,
        message: "Fetched all orders",
        products: docs.map((doc) => {
          return {
            id: doc._id,
            product: doc.product,
            quantity: doc.quantity,
            request: {
              type: "GET",
              url: "http://localhost/orders/" + doc._id,
            },
          };
        }),
      })
    )
    .catch((err) => res.status(500).json({ error: err.message }));
});

// Route - 2 : '/orders' --> POST method
router.post("/", (req, res, next) => {
  product
    .findById(req.body.productId)
    .then((product) => {
      if (!product) {
        return res.status(404).json({ message: "Product not Found" });
      }
      const order = new Order({
        _id: new mongoose.Types.ObjectId(),
        quantity: req.body.quantity,
        product: req.body.productId,
      });
      order
        .save()
        .then((doc) =>
          res.status(201).json({
            message: "Ordered Successfully",
            order: {
              id: doc._id,
              quantity: doc.quantity,
              product: doc.product,
              request: {
                type: "POST",
                url: "http://localhost/orders/" + doc._id,
              },
            },
          })
        )
        .catch((err) => res.status(500).json({ error: err.message }));
    })
    .catch((err) =>
      res.status(500).json({ message: "Product Not Found", error: err })
    );
});

// Route - 3 : '/orders/:orderId' --> GET method
router.get("/:orderId", (req, res, next) => {
  const id = req.params.orderId;
  Order.findById(id)
  .populate('product','name price')
    .then((doc) => {
      res.status(200).json({
        message: "Order Found",
        order: {
          product: doc.product,
          quantity: doc.quantity,
          id: doc._id,
          request: {
            type: "GET",
            url: "http://localhost/orders/" + doc._id,
          },
        },
      });
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

// Route - 4 : '/orders/:orderId' --> DELETE method
router.delete("/:orderId", (req, res, next) => {
  const id = req.params.orderId;
  Order.deleteOne({ _id: id })
    .then((doc) => {
      if (doc.deletedCount !== 0) {
        res.status(200).json({
          order: {
            data: doc,
            request: {
              type: "DELETE",
              url: "http://localhost/orders/" + id,
            },
          },
        });
      } else {
        res.status(500).json({ error: "Unable to delete the Order" });
      }
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

module.exports = router;
