const { fetchDataAdmin } = require("./data_admin.js");
const pool = require("./db.js");
const bcrypt = require("bcrypt");

// Fungsi untuk ambil data dari database PostgreSQL
const fetchDataUser = async () => {
  const connection = await pool.connect();

  const query = `SELECT * FROM data_user`;

  const results = await connection.query(query);

  connection.release();

  const users = results.rows;

  return users;
};
// Cari contact
const searchUser = async (id_user) => {
  const users = await fetchDataUser();
  const user = users.find(
    (data_user) =>
      data_user.id_user.toLowerCase() === id_user.toLowerCase()
  );
  return user;
};

const fetchUserById = async (id_user) => {
  const connection = await pool.connect();

  const query = "SELECT * FROM data_user WHERE id_user = $1";
  const result = await connection.query(query, [id_user]);

  connection.release();

  return result.rows[0];
};

// Add new Customer
const addDataUser = async (
  username,
  nama,
  mobile,
  email, 
  password
) => {
  const connection = await pool.connect();

  // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

  const query =
    "INSERT INTO data_user (username, nama, mobile, email, password) VALUES ($1, $2, $3, $4, $5) RETURNING *";

  const values = [id_user, nama, mobile, email, password];

  const result = await connection.query(query, values);

  connection.release();

  return result.rows[0];
};


const jumlahUser = async (nama) => {
  const connection = await pool.connect();

  try {
    let query = "SELECT COUNT(*) AS total_user FROM data_user";
    const values = [];

    if (nama) {
      query += " WHERE nama = $1";
      values.push(nama);
    }

    const result = await connection.query(query, values);

    return result.rows[0].total_user;
  } finally {
    connection.release();
  }
};

// Fungsi untuk Cek ID  data_customer
const checkIdUser = async (id_user) => {
  const connection = await pool.connect();

  try {
    // Mengecek apakah id_customer sudah terdaftar
    const duplicateCheck = await connection.query(
      "SELECT COUNT(*) FROM data_user WHERE id_user = $1",
      [id_user]
    );

    if (duplicateCheck.rows[0].count === 0) {
      // Jika tidak ada duplikat, mengembalikan null
      return null;
    }

    // Mengambil data pegawai berdasarkan id_user
    const result = await connection.query(
      "SELECT * FROM data_user WHERE id_user = $1",
      [id_user]
    );

    // Mengembalikan data data_user
    return result.rows[0];
  } finally {
    connection.release();
  }
};

// duplicate Id check
const duplicateIdUserCheck = async (id_user) => {
  const users = await fetchDataUser();
  return users.find(
    (data_user) => data_user.id_user === id_user
  );
};

// duplicate password check
const duplicatePasswordUser = async (password) => {
  const users = await fetchDataAdmin();
  return users.find((data_user) => data_user.password === password);
};

// duplicate Name check
const duplicateUserName = async (nama) => {
  const users = await fetchDataUser();
  return users.find((data_user) => data_user.nama === nama);
};

// email duplicate check
const emailDuplicateUserCheck = async (email) => {
  const users = await fetchDataUser();
  return users.find((data_user) => data_user.email === email);
};

// update contact
const updateUser = async (newContact) => {
    const connection = await pool.connect();
    const query = `
      UPDATE data_user
      SET id_user = $1, username = $2, nama = $3, mobile = $4, email = $5
      WHERE nama = $6
    `;
    await connection.query(query, [
      newContact.id_user,
      newContact.username,
      newContact.nama,
      newContact.mobile,
      newContact.email,
      newContact.oldName,
    ]);
  };

// Delete-customer
const deleteDataUser = async (id_user) => {
  const connection = await pool.connect();
  try {
    const query =
      "DELETE FROM data_user WHERE id_user = $1 RETURNING *";

    const result = await connection.query(query, [id_user]);

    return result.rows[0]; // Mengembalikan baris yang dihapus
  } finally {
    connection.release();
  }
};



module.exports = {
  fetchDataUser,
  addDataUser,
  deleteDataUser,
  fetchUserById,
  checkIdUser,
  duplicateIdUserCheck,
  searchUser,
  emailDuplicateUserCheck,
  updateUser,
  duplicateUserName,
  duplicatePasswordUser,
  jumlahUser
};