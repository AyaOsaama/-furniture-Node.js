class QueryFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  search() {
    if (this.queryString.search) {
      const keyword = {
        $or: [
          {
            "variants.name.en": {
              $regex: this.queryString.search,
              $options: "i",
            },
          },
          {
            "variants.name.ar": {
              $regex: this.queryString.search,
              $options: "i",
            },
          },
          {
            "description.en": {
              $regex: this.queryString.search,
              $options: "i",
            },
          },
          {
            "description.ar": {
              $regex: this.queryString.search,
              $options: "i",
            },
          },
        ],
      };
      this.query = this.query.find(keyword);
    }
    return this;
  }

  filter() {
    const queryObj = { ...this.queryString };
    const excludeFields = ["page", "limit", "search"];
    excludeFields.forEach((el) => delete queryObj[el]);

    const filterFields = [
      "categoryId",
      "subCategoryId",
      "color",
      "material",
      "brand",
    ];
    const filters = {};
    filterFields.forEach((field) => {
      if (queryObj[field]) {
        filters[field] = queryObj[field];
      }
    });

    if (queryObj.discountPrice) {
      const [min, max] = queryObj.discountPrice.split("-").map(Number);
      filters.discountPrice = { $gte: min || 0, $lte: max || Infinity };
    }
    this.query = this.query.find(filters);
    return this;
  }

  paginate(resultPerPage = 20) {
    const page = parseInt(this.queryString.page, 10) || 1;
    const skip = (page - 1) * resultPerPage;
    this.query = this.query.skip(skip).limit(resultPerPage);
    return this;
  }
}

module.exports = QueryFeatures;
