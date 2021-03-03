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
// let mailgun_apikey = "7358ad28f856cfd65979e48379e88998-6e0fd3a4-51f66c99";
// const mailgun = require("mailgun-js");
// const DOMAIN = "sandbox6ed57b4503d64bfb81cbf50d807cfea2.mailgun.org";
// const mg = mailgun({ apiKey: mailgun_apikey, domain: DOMAIN });
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
        expiresIn: "1m",
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
          <p><a href="https://gdrive-client.netlify.app/">https://gdrive-client.netlify.app/${token}</a></p>
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

app.post("/login", async (req, res) => {
  try {
    let client = await mongoClient.connect(dburl);
    let db = client.db("drive");
    let user = await db.collection("user").findOne({ email: req.body.email });
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

app.post("/forget", async (req, res) => {
  try {
    let client = await mongoClient.connect(dburl);
    let db = client.db("drive");
    let exists = await db.collection("user").findOne({ email: req.body.email });
    if (exists) {
      let token = jwt.sign({ email: req.body.email }, private_key, {
        expiresIn: "30m",
      });
      console.log(token);
      const data = {
        from: "no-reply@hello.com",
        to: req.body.email,
        subject: "Link for activating your account",
        html: `
          <h2>Please click this link to Reset your Password</h2>
          <p><a href="http://localhost:3000/reset">${url}/password/reset/${token}</a></p>`,
      };
      mg.messages().send(data, function (error, body) {
        console.log(body);
      });
      localStorage.setItem("token", token);
    }
  } catch (err) {
    console.log(err);
    res.json({
      message: "Something Went Wrong",
    });
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
    let client = await mongoClient.connect(urldb);
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
