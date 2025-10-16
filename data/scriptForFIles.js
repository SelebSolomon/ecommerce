const fs = require("fs");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const Product = require("../SRC/model/productsModel");
const Category = require("../SRC/model/categoryModel");
const path = require("path");
dotenv.config({ path: path.join(__dirname, "../.env") });

mongoose
  .connect(process.env.MONGOURL)
  .then(() => console.log(`mongodb is connected successfully `))
  .catch((err) => console.log(err));

const product = JSON.parse(
  fs.readFileSync(path.join(__dirname, "products.json"), "utf-8")
);
const category = JSON.parse(
  fs.readFileSync(path.join(__dirname, "category.json"), "utf-8")
);

//   IMPORTING DATA FROM THE JSON FILE
const importData = async () => {
  try {
    await Product.create(product);
    await Category.create(category);
    console.log("Imported data");
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

const deleteData = async () => {
  try {
    await Product.deleteMany();
    await Category.deleteMany();
    console.log("delete successfully deleted");
  } catch (error) {
    console.log(error);
  }
  process.exit();
};

console.log(process.argv);
if (process.argv[2] === "--import") {
  importData();
} else if (process.argv[2] === "--delete") {
  deleteData();
}
console.log(process.argv);
