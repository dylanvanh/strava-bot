import express from "express";
import { env } from "./config/env.js";

const app = express();

app.get("/", (req, res) => {
  res.send("");
});

app.listen(env.PORT);
