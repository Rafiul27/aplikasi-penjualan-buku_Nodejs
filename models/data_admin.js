const pool = require("./db.js");
const bcrypt = require('bcrypt');


// Fungsi untuk ambil data dari database PostgreSQL
const fetchDataAdmin = async () => {
    const connection = await pool.connect();
  
    const query = `SELECT * FROM data_admin`;
  
    const results = await connection.query(query);
  
    connection.release();
  
    const adminku = results.rows;
  
    return adminku;
  };
  
  const fetchDataAdminById = async (username) => {
    const connection = await pool.connect();
  
    const query = "SELECT * FROM data_admin WHERE username = $1";
    const result = await connection.query(query, [username]);
  
    connection.release();
  
    return result.rows[0];
  };
  
 // Add new Admin
const addDataAdminku = async (username, nama, mobile, email, password) => {
  const connection = await pool.connect();

  try {
    // Hash password sebelum menyimpan ke database
    const hashedPassword = await bcrypt.hash(password, 10);
    const query =
      "INSERT INTO data_admin (username, nama, mobile, email, password) VALUES ($1, $2, $3, $4, $5) RETURNING *";

    const values = [username, nama, mobile, email, hashedPassword];

    const result = await connection.query(query, values);

    return result.rows[0];
  } catch (error) {
    // Tangani kesalahan dengan tepat, misalnya, catat kesalahan
    console.error(error);
    throw new Error("Terjadi kesalahan saat menambahkan data");
  } finally {
    connection.release();
  }
};
  
  // Fungsi untuk Cek ID  data_admin
  const checkIdDataAdmin = async (id_admin) => {
    const connection = await pool.connect();
  
    try {
      // Mengecek apakah id_admin sudah terdaftar
      const duplicateCheck = await connection.query(
        "SELECT COUNT(*) FROM data_admin WHERE id_admin = $1",
        [id_admin]
      );
  
      if (duplicateCheck.rows[0].count === 0) {
        // Jika tidak ada duplikat, mengembalikan null
        return null;
      }
  
      // Mengambil data pegawai berdasarkan id_admin
      const result = await connection.query(
        "SELECT * FROM data_admin WHERE id_admin = $1",
        [id_admin]
      );
  
      // Mengembalikan data data_admin
      return result.rows[0];
    } finally {
      connection.release();
    }
  };
  
  // duplicate Id check
  // const duplicateIdCheck = async (id_admin) => {
  //   const adminku = await fetchDataAdmin();
  //   return adminku.find((data_admin) => data_admin.id_admin === id_admin);
  // };
  
  // duplicate Name check
  const duplicateName = async (nama) => {
    const adminku = await fetchDataAdmin();
    return adminku.find((data_admin) => data_admin.nama === nama);
  };

  // duplicate password check
  const duplicatePasswordAdmin = async (password) => {
    const adminku = await fetchDataAdmin();
    return adminku.find((data_admin) => data_admin.password === password);
  };
  
  // email duplicate check
  const emailDuplicateCheck = async (email) => {
    const adminku = await fetchDataAdmin();
    return adminku.find((data_admin) => data_admin.email === email);
  };
  
  const updateAdmin = async (data) => {
    try {
      const connection = await pool.connect();
      const query = `
        UPDATE data_admin
        SET username = $1, nama = $2, mobile = $3 ,email = $4 
        WHERE username = $5
      `;
      await connection.query(query, [
        data.username,
        data.nama,
        data.mobile,
        data.email,
        data.oldUsername,
      ]);
      connection.release();
    } catch (err) {
      console.error(err);
      throw err; // lempar kesalahan untuk menunjukkan bahwa operasi database gagal
    }
  };

  
  // Delete-Admin
  const deleteDataAdminku = async (username) => {
    const connection = await pool.connect();
    try {
      const query = "DELETE FROM data_admin WHERE username = $1 RETURNING *";
  
      const result = await connection.query(query, [username]);
  
      return result.rows[0]; // Mengembalikan baris yang dihapus
    } finally {
      connection.release();
    }
  };
  
  const searchDataAdmin = async (username) => {
    const adminku = await fetchDataAdmin();
    const admin = adminku.find(
        (data_admin) => data_admin.username.toLowerCase() === username.toLowerCase()
    );

    if (!admin) {
        // Handle ketika data admin tidak ditemukan, misalnya redirect atau tampilkan pesan
        return null;
    }

    return admin;
};


  
  module.exports = {
    fetchDataAdmin,
    addDataAdminku,
    deleteDataAdminku,
    fetchDataAdminById,
    checkIdDataAdmin,
    searchDataAdmin,
    emailDuplicateCheck,
    updateAdmin,
    duplicateName,
    duplicatePasswordAdmin,
  };
  