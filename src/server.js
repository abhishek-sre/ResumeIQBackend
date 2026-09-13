require("dotenv").config();

const app = require("./app");
const connectDatabase = require("./db");

const port = process.env.PORT || 3000;

async function startServer() {
    await connectDatabase();

    app.listen(port, () => {
        console.log(`Server running on port ${port}`);
    });
}

startServer().catch((error) => {
    console.error("Unable to start server:", error.message);
    process.exit(1);
});