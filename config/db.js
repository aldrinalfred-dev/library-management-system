const { MongoClient, ServerApiVersion } = require("mongodb");
require('dotenv').config()
const mongoose = require('mongoose');

// Create a MongoClient object
const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri, {
	serverApi: {
		version: ServerApiVersion.v1,
		strict: true,
		deprecationErrors: true,
	},
});
mongoose.connect(uri).then(() => console.log("Library MongoDB connected"))
.catch(err => console.log(err))

async function run() {
	try {
		// Connect the client to the server	(optional starting in v4.7)
		await client.connect();
		// Send a ping to confirm a successful connection
		await client.db("admin").command({ ping: 1 });
		console.log(
			"Pinged your deployment. You successfully connected to MongoDB!"
		);
	} finally {
		// Ensures that the client will close when you finish/error
		await client.close();
	}
}
run().catch(console.dir);

