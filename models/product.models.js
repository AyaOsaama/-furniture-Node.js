const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  variants: [
    {
      name: {
        en: { type: String, required: true, trim: true, minlength: 3, maxlength: 50 },
        ar: { type: String, required: true, trim: true, minlength: 3, maxlength: 50 }
      },
      price: { type: Number, required: true, min: 0 },
      color: {
        en: { type: String },
        ar: { type: String }
      },
      image: { type: String, trim: true },
      images: [{ type: String, trim: true }],
      inStock: { type: Number, default: 0, min: 0 },
      discountPrice: {
        type: Number,
        min: 0,
        validate: {
          validator: function (value) {
            return value < this.price;
          },
          message: "Discount price must be less than the original price"
        }
      },
      averageRating: { type: Number, default: 0 },
      ratingCount: { type: Number, default: 0 },
    }
  ],

  description: {
    en: { type: String, required: true, trim: true, minlength: 10, maxlength: 500 },
    ar: { type: String, required: true, trim: true, minlength: 10, maxlength: 500 }
  },

  material: {
    en: { type: String },
    ar: { type: String }
  },

  brand: { type: String },

  categories: {
    main: { type: mongoose.Schema.Types.ObjectId, ref: 'Category'},
    sub: { type: mongoose.Schema.Types.ObjectId, ref: 'Subcategory'}
  },

  searchContent: { type: String },

}, { timestamps: true });

ProductSchema.index({ searchContent: 'text' });

ProductSchema.pre('save', function (next) {
  const variantNames = this.variants.map(v => `${v.name.en} ${v.name.ar}`).join(' ');
  const descriptions = `${this.description.en} ${this.description.ar}`;
  const brand = this.brand || '';
  const material = `${this.material?.en || ''} ${this.material?.ar || ''}`;

  this.searchContent = `${variantNames} ${descriptions} ${brand} ${material}`.toLowerCase();
  next();
});

const ProductModel = mongoose.model('products', ProductSchema);
module.exports = ProductModel;
