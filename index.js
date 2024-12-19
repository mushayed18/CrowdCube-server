require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bnuku.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const campaignsCollection = client
      .db("CrowdcubeDB")
      .collection("campaigns");

    const usersCollection = client.db("CrowdcubeDB").collection("users");

    const donationsCollection = client
      .db("CrowdcubeDB")
      .collection("donations");

    app.post("/campaigns", async (req, res) => {
      const newCampaign = req.body;

      if (typeof newCampaign.deadline === "string") {
        newCampaign.deadline = new Date(newCampaign.deadline); 
      }

      const result = await campaignsCollection.insertOne(newCampaign);
      res.send(result);
    });

    app.get("/campaigns", async (req, res) => {
      const cursor = campaignsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    app.get("/campaigns/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await campaignsCollection.findOne(query);
      res.send(result);
    });

    app.delete("/campaigns/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await campaignsCollection.deleteOne(query);
      res.send(result);
    });

    app.put("/campaigns/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };

      const updatedCampaigns = req.body;

      if (typeof updatedCampaigns.deadline === "string") {
        updatedCampaigns.deadline = new Date(updatedCampaigns.deadline); 
      }

      const campaign = {
        $set: {
          thumbnail: updatedCampaigns.thumbnail,
          title: updatedCampaigns.title,
          type: updatedCampaigns.type,
          description: updatedCampaigns.description,
          minDonation: updatedCampaigns.minDonation,
          deadline: updatedCampaigns.deadline,
          email: updatedCampaigns.email,
          name: updatedCampaigns.name,
        },
      };

      const result = await campaignsCollection.updateOne(
        filter,
        campaign,
        options
      );
      res.send(result);
    });

    // user related api
    app.post("/users", async (req, res) => {
      const newUser = req.body;
      const result = await usersCollection.insertOne(newUser);
      res.send(result);
    });

    app.get("/users", async (req, res) => {
      const cursor = usersCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // my campaign related api
    app.get("/my-campaigns/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const result = await campaignsCollection.find(query).toArray();
      res.send(result);
    });

    // my donations related api
    app.post("/all-donations", async (req, res) => {
      const newDonation = req.body;
      const result = await donationsCollection.insertOne(newDonation);
      res.send(result);
    });

    app.get("/my-donations/:email", async (req, res) => {
      const email = req.params.email;
      const query = { donateEmail: email };
      const result = await donationsCollection.find(query).toArray();
      res.send(result);
    });

    // api to fetch 6 running campaigns
    app.get("/running-campaigns", async (req, res) => {
      const currentDate = new Date();
      const runningCampaigns = await campaignsCollection
        .find({ deadline: { $gte: currentDate } })
        .limit(6)
        .toArray();
      res.send(runningCampaigns);
    });

    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server is running");
});

app.listen(port, () => {
  console.log(`Crowd cube server is running on port: ${port}`);
});
