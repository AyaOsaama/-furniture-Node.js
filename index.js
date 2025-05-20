const express = require("express");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const app = express();
// require('dotenv').config();
const dotenv = require("dotenv");
dotenv.config();
//conecct to DB

const mongoose = require("mongoose");
const DB_URI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.8fkcsmr.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
mongoose
  .connect(DB_URI)
  .then(() => {
    console.log("Successfully connected to the database");
  })
  .catch((err) => {
    console.error("Failed to connect to the database:", err);
  });
//middleware
// app.use(
//   cors({
//     origin: "*",
//   })
// );
// app.use(cors({
//   origin: 'http://localhost:4200',
//   credentials: true
// }));
app.use(cors())
app.use(express.json());
app.use("/uploads", express.static("uploads"));
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument,{
  explorer: true,
  swaggerOptions: {
    url: './swagger.json',
  },
}));

// Routes
const authRoutes = require("./routes/auth.routes.js");
const userRoutes = require("./routes/user.routes.js");
const productRoutes = require("./routes/product.routes.js");
const cartRoutes = require("./routes/cart.routes.js");
const orderRoutes = require("./routes/order.routes.js");
const whishlistRoutes = require("./routes/wishlist.routes.js");
const categoryRoutes = require("./routes/category.routes.js");
const subcategoryRoutes = require("./routes/subcategory.routes.js");
const ratingRoutes = require("./routes/rating.routes.js");
const postRoutes = require("./routes/post.routes.js");
const imageRoutes = require('./routes/uploadImage.routes.js')
app.get('/',(req,res)=>{
  return res.json({message:"Hello"})
})
app.use("/auth", authRoutes);
app.use("/users", userRoutes);
app.use("/whishlist", whishlistRoutes);
app.use("/products/", productRoutes);
app.use("/carts", cartRoutes);
app.use("/orders", orderRoutes);
app.use("/categories", categoryRoutes);
app.use("/subcategories", subcategoryRoutes);
app.use("/ratings", ratingRoutes);
app.use("/posts", postRoutes);
app.use("/upload-image",imageRoutes)

// Not Found middleware
app.use((req, res, next) => {
  res.status(404).json({ message: `${req.originalUrl} Not Found` });
});

// Error Handling middleware
app.use(function (err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || "Api Error";
  res.status(statusCode).json({ message });
});

// server
let port = 3000 || process.env.PORT;
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
