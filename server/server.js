const express = require('express');
const cors = require('cors');
const dataRoutes = require('./routes/dateRoutes.js');


const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cors({
    origin: '*',
}));
app.use('/api', dataRoutes);

app.get("/", (req, res) => {
    res.send("Server is running");
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});