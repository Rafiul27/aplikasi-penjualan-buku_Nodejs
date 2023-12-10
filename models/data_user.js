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
const searchUser = async (username) => {
  const users = await fetchDataUser();
  const user = users.find(
    (data_user) =>
      data_user.username.toLowerCase() === username.toLowerCase()
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
const addDataUser = async (username, nama, mobile, email, password) => {
  const connection = await pool.connect();

  try {
    // Hash password sebelum menyimpan ke database
    const hashedPassword = await bcrypt.hash(password, 10);
    const query =
      "INSERT INTO data_user (username, nama, mobile, email, password) VALUES ($1, $2, $3, $4, $5) RETURNING *";

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

// duplicate username check
const duplicateUsernameUser = async (username) => {
  const users = await fetchDataUser();
  return users.find((data_customer) => data_customer.username === username);
};

// duplicate Name check
const duplicateUserName = async (name) => {
  const users = await fetchDataUser();
  return users.find((data_user) => data_user.name === name);
};

// email duplicate check
const emailDuplicateUserCheck = async (email) => {
  const users = await fetchDataUser();
  return users.find((data_user) => data_user.email === email);
};

// update contact
const updateUser = async (datauser) => {
    const connection = await pool.connect();
    const query = `
      UPDATE data_user
      SET username = $1, nama = $2, mobile = $3, email = $4
      WHERE id_user = $5
    `;
    console.log(datauser)
    const result =  await connection.query(query, [
      // datauser.id_user,
      datauser.username,
      datauser.nama,
      datauser.mobile,
      datauser.email,
      // datauser.password,
      datauser.id_user,
    ]);
    return result;
  };

// Delete-customer
const deleteDataUser = async (username) => {
  const connection = await pool.connect();
  try {
    const query =
      "DELETE FROM data_user WHERE username = $1 RETURNING *";

    const result = await connection.query(query, [username]);

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
  duplicateUsernameUser,
  jumlahUser
};