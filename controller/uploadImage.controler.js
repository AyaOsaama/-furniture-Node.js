const  catchAsync=require('../utils/catchAsync.utils')
exports.uploadUserImage = catchAsync(async (req, res, next) => {
    if (!req.file || !req.file.path) {
      return next(new ApiError(400, "No image provided"));
    }
  
    res.status(200).json({
      message: "Image uploaded successfully",
      imageUrl: req.file.path,
    });
  });
  