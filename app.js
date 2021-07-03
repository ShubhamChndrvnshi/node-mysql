const app = require("./config/api-config");
require("dotenv").config();
const PORT = process.env.PORT || 9890;

app.listen( PORT, function() {
    console.log("server connected to port " + PORT);
});
