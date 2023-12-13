const pool = require("./models/db.js");

const addCart = async (data) => {
  // Set quantity to 1 if not provided
  const jumlah = data[3] || 1;

  const cart = await pool.query(
    "insert into cart (cart_id, id_buku, title, jumlah, harga) values ($1, $2, $3, $4, $5)",
    [data[0], data[1], jumlah]
  );
  return cart;
};

const searchCart = async (id_buku) => {
  const cart = await pool.query(
    "select * from cart where id_buku = $1",
    [id_buku]
  );
  return cart.rows[0];
};

const updateCart = async (data) => {
  const cart = await pool.query(
    "update cart set jumlah = $1 where id_buku = $2",
    [data[2], data[1]]
  );
  return cart;
};

const searchCartByUserId = async (data) => {
  const cart = await pool.query(
    "SELECT cart.cart_id, cart.id_buku, data_buku.title, cart.jumlah as jumlah_beli, data_buku.stock_quantity as jumlah_barang, harga FROM cart INNER JOIN data_buku ON cart.id_buku = data_buku.id_buku WHERE user_id = $1 ORDER BY cart_id asc",
    [data]
  );
  return cart.rows;
};

module.exports = { addCart, searchCart, updateCart, searchCartByUserId };