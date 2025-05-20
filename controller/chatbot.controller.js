const Product = require("../models/product.models");
const catchAsync = require("../utils/catchAsync.utils");
const axios = require("axios");
const ApiError = require("../utils/ApiError.utils");
require("dotenv").config();

exports.chatbot = catchAsync(async (req, res) => {
  const { question } = req.body;
  console.log("Received question:", question);

  const products = await Product.find({ $text: { $search: question } }).limit(3);
  console.log("Products found:", products);

  let reply = "";
  let productsInfo = [];

  if (!products || products.length === 0) {
    // لو مفيش منتجات، ندي OpenAI فرصة يرد برد عام
    const fallbackMessages = [
      {
        role: "system",
        content: `You are a helpful furniture assistant. If you don't have information related to the question, reply politely that you don't have enough data.`,
      },
      { role: "user", content: question },
    ];

    try {
      const fallbackResponse = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: fallbackMessages,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      reply = fallbackResponse.data.choices[0].message.content;
    } catch (err) {
      console.error("OpenAI fallback error:", err.response?.data || err.message);
      throw new ApiError(500, "OpenAI fallback request failed");
    }

    return res.status(200).json({ reply, products: [] });
  }

  // لو فيه منتجات، نكوّن السياق من بياناتهم
  const context = products
    .map((p) => {
      const name = p.variants[0]?.name?.en || "N/A";
      const price = p.variants[0]?.price || "N/A";
      const description = p.description?.en || "N/A";
      return `Name: ${name}, Price: ${price}, Description: ${description}`;
    })
    .join("\n");

  const messages = [
    {
      role: "system",
      content: `You are a furniture assistant. Answer only based on this product information:\n${context}`,
    },
    { role: "user", content: question },
  ];

  let response;
  try {
    response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-4o-mini",
        messages,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    reply = response.data.choices[0].message.content;

    // تجهيز بيانات المنتج لإرسالها في الريسبونس
    productsInfo = products.map((p) => ({
      name: p.variants[0]?.name?.en || "N/A",
      price: p.variants[0]?.price || "N/A",
      description: p.description?.en || "N/A",
      image: p.variants[0]?.images?.[0] || p.images?.[0] || null,
      id: p._id,
    }));
  } catch (err) {
    console.error("OpenAI API Error:", err.response?.data || err.message);
    throw new ApiError(500, "OpenAI request failed");
  }

  res.json({ reply, products: productsInfo });
});
