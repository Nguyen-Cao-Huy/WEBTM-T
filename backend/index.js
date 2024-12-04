const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
require('dotenv').config()
const connectDB = require('./config/db')
const router = require('./routes')
const vnpayRoutes = require('./routes/vnpay');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Đăng ký các router
app.use("/api", router); // Đảm bảo `router` là một instance của `express.Router()`
app.use('/api/vnpay', vnpayRoutes); // Đảm bảo `vnpayRoutes` là một instance của `express.Router()`

const PORT = process.env.PORT || 8080; // Sửa thứ tự PORT để lấy biến môi trường đúng

// Kết nối DB và khởi chạy server
connectDB().then(() => {
    app.listen(PORT, () => {
        console.log("Connected to DB");
        console.log(`Server is running on http://localhost:${PORT}`);
    });
}).catch((err) => {
    console.error("Error connecting to DB:", err.message);
});