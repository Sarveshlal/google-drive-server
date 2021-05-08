const express = require("express");
const app = express();
app.use(express.json());
const nodemailer = require("nodemailer");
const url = require("url");
const cors = require("cors");
app.use(cors());
const mongodb = require("mongodb");
const mongoClient = mongodb.MongoClient;
let dburl =
  "mongodb+srv://sarvesh:sarvesh@cluster0.9ltte.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const bcriptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
let port = process.env.PORT || 8080;
let users = [];

let private_key = "1234f";

app.post("/registration", async (req, res) => {
  try {
    let client = await mongoClient.connect(dburl);
    let db = client.db("drive");
    let exists = await db.collection("user").findOne({ email: req.body.email });
    if (exists) {
      res.json({
        message: "Already registered",
      });
    } else {
      let token = jwt.sign({ email: req.body.email }, private_key, {
        expiresIn: "5m",
      });
      console.log(token);
      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "sarveshlal05@gmail.com",
          pass: "Hpnotebook@05",
        },
      });
      var mailOptions = {
        from: "sarveshlal@gmail.com",
        to: req.body.email,
        subject: "Activation Link",
        html: `
          <h2>Please click this link to Reset your Password</h2>
          <p><a href="https://gdrive-client.netlify.app/aclogin">https://gdrive-client.netlify.app/${token}</a></p>
        `,
      };
      transporter.sendMail(mailOptions, function (err, data) {
        if (err) console.log(err);
        else console.log("Email sent: " + data.response);
      });
      let salt = await bcriptjs.genSalt(10);
      let hash = await bcriptjs.hash(req.body.password, salt);
      req.body.password = hash;
      console.log(hash);
      let resp = await db.collection("user").insertOne(req.body);
      client.close();
      res.json({
        message: "record Inserted",
      });
    }
  } catch (err) {
    console.log(err);
    res.json({
      message: "something went wrong",
    });
  }
});

app.post("/aclogin", async (req, res) => {
  try {
    let client = await mongoClient.connect(dburl);
    let db = client.db("drive");
    let user = await db.collection("user").findOne({ email: req.body.email });
    if (user) {
      let result = await bcriptjs.compare(req.body.password, user.password);
      console.log(result);
      await db
        .collection("user")
        .updateOne(
          { email: req.body.email },
          { $set: { status: "active" } },
          { upsert: true }
        );
      if (result) {
        res.json({
          message: "allow user",
        });
      } else {
        res.json({
          message: "invalid credentials",
        });
      }
    } else {
      res.json({
        message: "no records",
      });
    }
  } catch {
    res.json({
      message: "something went wrong",
    });
  }
});

app.post("/login", async (req, res) => {
  try {
    let client = await mongoClient.connect(dburl);
    let db = client.db("drive");
    let users = await db.collection("user").findOne({ email: req.body.email });
    if (users) {
      let user = await db
        .collection("user")
        .findOne({ $and: [{ email: req.body.email }, { status: "active" }] });
      if (user) {
        let result = await bcriptjs.compare(req.body.password, user.password);
        console.log(result);
        if (result) {
          res.json({
            message: "allow user",
          });
        } else {
          res.json({
            message: "invalid credentials",
          });
        }
      } else {
        req.json({
          message: "Account is Disabled please Check your mail.",
        });
      }
    } else {
      res.json({
        message: "Account Unavailable",
      });
    }
  } catch {
    res.json({
      message: "something went wrong",
    });
  }
});

app.post("/forget", async (req, res) => {
  try {
    let client = await mongoClient.connect(dburl);
    let db = client.db("drive");
    let exists = await db.collection("user").findOne({ email: req.body.email });
    if (exists) {
      let token = jwt.sign({ email: req.body.email }, private_key, {
        expiresIn: "5m",
      });
      console.log(token);
      var transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: "sarveshlalacc2@gmail.com",
          pass: "Sarvesh@05",
        },
      });
      var mailOptions = {
        from: "sarveshlal@gmail.com",
        to: req.body.email,
        subject: "Activation Link",
        html: `
          <h2>Please click this link to Reset your Password</h2>
          <p><a href="https://gdrive-client.netlify.app/reset">https://gdrive-client.netlify.app/${token}</a></p>
        `,
      };
      transporter.sendMail(mailOptions, function (err, data) {
        if (err) console.log(err);
        else console.log("Email sent: " + data.response);
      });
      localStorage.setItem("token", token);
      res.json({
        message: "Email sent",
      });
    } else {
      res.json({
        message: "user not found",
      });
    }
  } catch (err) {
    console.log(err);
    res.json({
      message: "Something Went Wrong",
    });
  } finally {
    client.close();
  }
});

app.put("/reset", async (req, res) => {
  try {
    let client = await mongoClient.connect(dburl);
    let db = client.db("drive");
    let salt = await bcriptjs.genSalt(10);
    let hash = await bcriptjs.hash(req.body.password, salt);
    req.body.password = hash;
    console.log(hash);
    let resp = await db
      .collection("user")
      .updateOne(
        { email: req.params.email },
        { $set: { password: req.body.password } },
        { upsert: true }
      );
    client.close();
    res.json({
      message: "Password Updated",
    });
  } catch (err) {
    console.log(err);
    res.json({
      message: "Something Went wrong while resetting password",
    });
  }
});

app.get("/users", async (req, res) => {
  try {
    let client = await mongoClient.connect(dburl);
    let db = client.db("drive");
    const userlist = await db.collection("user").find().toArray();
    client.close();
    res.json(userlist);
  } catch (err) {
    console.log(err);
    res.json({
      message: "something went wrong",
    });
  }
});

app.listen(port, () => {
  console.log(`server started at port : ${port}`);
});
