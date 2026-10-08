import "dotenv/config";
import express, { type Request, type Response } from "express";
import cors from "cors";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import pool from "../db/jwtdb.ts";

// 1. TAMBAHKAN IMPORT MIDDLEWARE DI SINI
import { upload } from "../middleware/upload.ts";
import { authenticateToken, type AuthRequest } from "../middleware/auth.ts";

const app = express();

app.use(cors());
app.use(express.json());

app.post("/register", async (req: Request, res: Response) => {
  try {
    // === TAMBAHAN VALIDASI BACKEND ===
    if (!req.body.username || !req.body.password) {
      res.status(400).json({
        message: "Username dan password wajib diisi, tidak boleh kosong!",
      });
      return;
    }
    // =================================

    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    const [result] = await pool.execute(
      "INSERT INTO users (username, password) VALUES (?, ?)",
      [req.body.username, hashedPassword],
    );

    res.status(201).json({ message: "User berhasil dibuat" });
  } catch (error: any) {
    if (error.code === "ER_DUP_ENTRY") {
      res.status(400).json({ message: "Username sudah digunakan" });
      return;
    }
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
});

app.post("/login", async (req: Request, res: Response) => {
  try {
    // === TAMBAHAN VALIDASI BACKEND ===
    if (!req.body.username || !req.body.password) {
      res
        .status(400)
        .json({ message: "Username dan password wajib diisi untuk login!" });
      return;
    }
    // =================================

    const [rows]: any = await pool.execute(
      "SELECT * FROM users WHERE username = ?",
      [req.body.username],
    );

    const user = rows[0];
    if (!user) {
      res.status(400).json({ message: "User tidak ditemukan" });
      return;
    }

    if (await bcrypt.compare(req.body.password, user.password)) {
      const accessToken = jwt.sign(
        { id: user.id, username: user.username },
        process.env.ACCESS_TOKEN_SECRET || "rahasia_super_aman",
        { expiresIn: "1h" },
      );
      res.json({ accessToken });
    } else {
      res.status(401).json({ message: "Password salah" });
    }
  } catch (error: any) {
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
});

// 2. TAMBAHKAN ENDPOINT UPLOAD DI SINI (Di bawah login)
app.post(
  "/upload-foto",
  authenticateToken,
  upload.single("foto"),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        res.status(400).json({ message: "Tidak ada gambar yang diunggah" });
        return;
      }

      const imageUrl = req.file.path;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ message: "User tidak ditemukan" });
        return;
      }

      await pool.execute("UPDATE users SET profile_picture = ? WHERE id = ?", [
        imageUrl,
        userId,
      ]);

      res.json({ message: "Foto profil berhasil diunggah", url: imageUrl });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ message: "Terjadi kesalahan saat mengunggah gambar" });
    }
  },
);

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => {
  console.log(`Server Express berhasil berjalan di http://localhost:${PORT}`);
});