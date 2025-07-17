const express = require("express");

const mongoose = require("mongoose");

const { PostModel } = require("./models/PostModel");

const { PostList } = require("./posts");

const app = express();
require('dotenv').config();

const mongoUri = process.env.MONGO_URI;

mongoose

  .connect(mongoUri)

  .then(() => {
    console.log("Connected to MongoDB Successfully");
  })

  .catch((err) => {
    console.log("Could not connect to MongoDB");

    console.error(err);
  });

const PORT = process.env.PORT || 2020;

const db = mongoose.connection;

db.once("open", async () => {
  if ((await PostModel.countDocuments().exec()) > 1) return;

  Promise.all(
    PostList.map((post) => {
      return PostModel.create({
        title: post.title,

        body: post.body,

        userId: post.userId,
      });
    })
  )

    .then(() => {
      console.log("Post added successfully");
    })

    .catch((err) => {
      console.log(err);
    });
});

app.get("/posts", async (req, res) => {
  try {
    const pageNumber = parseInt(req.query.pageNumber) || 0;

    const limit = parseInt(req.query.limit) || 12;

    const result = {};

    const totalPosts = await PostModel.countDocuments().exec();

    let startIndex = pageNumber * limit;

    const endIndex = (pageNumber + 1) * limit;

    result.totalPosts = totalPosts;

    if (startIndex > 0) {
      result.previous = {
        pageNumber: pageNumber - 1,

        limit: limit,
      };
    }

    if (endIndex < (await PostModel.countDocuments().exec())) {
      result.next = {
        pageNumber: pageNumber + 1,

        limit: limit,
      };
    }

    result.data = await PostModel.find()

      .sort("-_id")

      .skip(startIndex)

      .limit(limit)

      .exec();

    result.rowsPerPage = limit;

    return res.json({ msg: "Post Fetched successfully", data: result });
  } catch (error) {
    console.log(error);

    return res.status(500).json({ msg: "Sorry, something went wrong" });
  }
});


app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <title>Post Viewer</title>
        <meta charset="UTF-8" />
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: #f9f9f9;
            margin: 0;
            padding: 2rem;
            color: #333;
          }

          h1 {
            text-align: center;
            margin-bottom: 2rem;
            color: #2c3e50;
          }

          .controls {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 1rem;
            margin-bottom: 2rem;
            flex-wrap: wrap;
          }

          select, button {
            padding: 10px 16px;
            font-size: 16px;
            border: 1px solid #ccc;
            border-radius: 6px;
            background: white;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          select:hover, button:hover {
            background: #eaeaea;
          }

          .posts {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1rem;
            max-width: 1000px;
            margin: 0 auto;
          }

          .post {
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
            padding: 1rem;
            transition: transform 0.2s ease;
          }

          .post:hover {
            transform: translateY(-3px);
          }

          .post h3 {
            margin: 0 0 0.5rem;
            font-size: 1.2rem;
            color: #2980b9;
          }

          .post p {
            margin: 0;
          }

          .info {
            text-align: center;
            margin-top: 2rem;
            color: #777;
          }
        </style>
      </head>
      <body>
        <h1>📚 Post Viewer</h1>

        <div class="controls">
          <label for="limit">Posts per page:</label>
          <select id="limit" onchange="resetAndLoad()">
            <option value="3">3</option>
            <option value="5" selected>5</option>
            <option value="10">10</option>
          </select>

          <button onclick="prevPage()">⬅️ Previous</button>
          <button onclick="nextPage()">Next ➡️</button>
        </div>

        <div id="output" class="posts"></div>
        <div class="info" id="paginationInfo"></div>

        <script>
          let currentPage = 0;

          function resetAndLoad() {
            currentPage = 0;
            loadPosts();
          }

          async function loadPosts() {
            const limit = document.getElementById('limit').value;
            const res = await fetch(\`/posts?limit=\${limit}&pageNumber=\${currentPage}\`);
            const json = await res.json();

            const output = document.getElementById('output');
            const info = document.getElementById('paginationInfo');
            output.innerHTML = '';
            info.innerHTML = '';

            const posts = json?.data?.data || [];

            if (posts.length === 0) {
              output.innerHTML = '<p>No posts available.</p>';
              return;
            }

            posts.forEach(post => {
              const div = document.createElement('div');
              div.className = 'post';
              div.innerHTML = '<h3>' + post.title + '</h3><p>' + post.body + '</p>';
              output.appendChild(div);
            });

            const total = json.data.totalPosts;
            info.innerHTML = \`Page \${currentPage + 1} — Showing \${posts.length} of \${total} total posts\`;
          }

          function nextPage() {
            currentPage++;
            loadPosts();
          }

          function prevPage() {
            if (currentPage > 0) {
              currentPage--;
              loadPosts();
            }
          }

          // Load first page initially
          loadPosts();
        </script>
      </body>
    </html>
  `);
});



app.listen(PORT, () => console.log(`App listenig on port ${PORT}`));

/*

For this tour we'll focus on the core packages of tidyverse we discussed 

earlier: ggplot2, tidyr, readr, dplyr, tibble, purrr, stringr and forcats.



*/
