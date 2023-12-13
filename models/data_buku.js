const pool = require("../models/db.js");

// Fungsi untuk ambil data dari database PostgreSQL
const fetchDataBook = async () => {
  const connection = await pool.connect();

  const query = `SELECT * FROM data_buku`;

  const results = await connection.query(query);

  connection.release();

  const books = results.rows;

  return books;
};

const fetchBookById = async (product_id) => {
  const connection = await pool.connect();

  const query = "SELECT * FROM data_buku WHERE id_buku = $1";
  const result = await connection.query(query, [id_buku]);

  connection.release();

  return result.rows[0];
};

// Add new Products
const addDataBook = async (
  title,
  deksripsi,
  category,
  penerbit,
  pengarang,
  harga,
  jumlah,
  image_buku
) => {
  const connection = await pool.connect();

  const query =
    "INSERT INTO data_buku (title, deksripsi, category, penerbit, pengarang, harga, jumlah, image_buku) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *";

  const values = [title, deksripsi, category, penerbit, pengarang, harga, jumlah, image_buku];

  const result = await connection.query(query, values);

  connection.release();

  return result.rows[0];
};

const totalBook = async (title) => {
  const connection = await pool.connect();

  try {
    let query = "SELECT COUNT(*) AS total_book FROM data_buku";
    const values = [];

    if (title) {
      query += " WHERE title = $1";
      values.push(title);
    }

    const result = await connection.query(query, values);

    return result.rows[0].total_produk;
  } finally {
    connection.release();
  }
};

// Fungsi untuk Cek ID  products
const checkIdBooks = async (title) => {
  const connection = await pool.connect();

  try {
    // Mengecek apakah title sudah terdaftar
    const duplicateCheck = await connection.query(
      "SELECT COUNT(*) FROM data_buku WHERE title = $1",
      [title]
    );

    if (duplicateCheck.rows[0].count === 0) {
      // Jika tidak ada duplikat, mengembalikan null
      return null;
    }

    // Mengambil data pegawai berdasarkan title
    const result = await connection.query(
      "SELECT * FROM data_buku WHERE title = $1",
      [title]
    );

    // Mengembalikan data products
    return result.rows[0];
  } finally {
    connection.release();
  }
};

// duplicate Id check
const duplicateIdBooksCheck = async (id_buku) => {
  const products = await fetchDataBook();
  return products.find((data_buku) => data_buku.id_buku === id_buku);
};

// duplicate Name check
const duplicateBooksName = async (title) => {
  const books = await fetchDataBook();
  return books.find((data_buku) => data_buku.title === title);
};

// email duplicate check
const emailDuplicateBooksCheck = async (email) => {
  const books = await fetchDataBook();
  return books.find((data_buku) => data_buku.email === email);
};

// update contact
const updateBooks = async (newContact) => {
  const connection = await pool.connect();
  const query = `
    UPDATE products
    SET title = $2, deksripsi = $3, category = $4, penerbit = $5, pengarang = $6, harga = $7, jumlah = $8, image_buku = $9
    WHERE id_buku = $10
  `;
  await connection.query(query, [
    newContact.title,
    newContact.deksripsi,
    newContact.category,
    newContact.penerbit,
    newContact.pengarang,
    newContact.harga,
    newContact.jumlah,
    newContact.image_buku,
    newContact.id_buku,
  ]);
};

// Delete-products
const deleteDataBooks = async (title) => {
  const connection = await pool.connect();
  try {
    const query = "DELETE FROM data_buku WHERE title = $1 RETURNING *";

    const result = await connection.query(query, [title]);

    return result.rows[0]; // Mengembalikan baris yang dihapus
  } finally {
    connection.release();
  }
};

// Cari contact
const searchBooks = async (id_buku) => {
  try {
    // Ambil data buku (diasumsikan ini operasi asynchronous)
    const books = await fetchDataBook();

    // Cari buku berdasarkan judul (case-insensitive)
    const foundBook = books.find((data_buku) => {
      return (
        data_buku.id_buku &&
        typeof data_buku.id_buku === 'string' &&
        data_buku.id_buku.toLowerCase() === id_buku.toLowerCase()
      );
    });

    return foundBook; // Kembalikan buku jika ditemukan, atau null jika tidak ditemukan
  } catch (error) {
    console.error(error);
    throw new Error("Terjadi kesalahan dalam pencarian buku");
  }
};


module.exports = {
  fetchDataBook,
  addDataBook,
  fetchBookById,
  checkIdBooks,
  duplicateIdBooksCheck,
  searchBooks,
  emailDuplicateBooksCheck,
  deleteDataBooks,
  duplicateBooksName,
  updateBooks,
  totalBook,
};