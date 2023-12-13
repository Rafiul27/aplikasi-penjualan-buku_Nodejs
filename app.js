// Mengimpor modul Express.js
const express = require('express');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const uploader = require('multer');

const expressLayouts = require('express-ejs-layouts'); // Mengimpor modul express-ejs-layouts
const { body, check, validationResult } = require('express-validator');

const {
    fetchDataAdmin,
    addDataAdminku,
    deleteDataAdminku,
    fetchDataAdminById,
    checkIdDataAdmin,
    searchDataAdmin,
    emailDuplicateCheck,
    duplicatePasswordAdmin,
    updateAdmin,
    duplicateName,
} = require("./models/data_admin")

const {
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
    duplicateUsernameUser
} = require("./models/data_user");

const {
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
} = require("./models/data_buku");

// Menginisialisasi aplikasi Express
const app = express();
const path = require('path');
const pool = require('./models/db');
dotenv.config();

const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');


// Menentukan port yang akan digunakan
const port = 3000;


// Mengatur EJS sebagai template engine
app.set("layout", "layouts/main-layouts");
app.set('view engine', 'ejs');
app.use(express.json());



// Middleware to serve static files (stylesheets, images, etc.)
app.use(express.static(path.join(__dirname, 'public')));


// Menggunakan express-ejs-layouts sebagai middleware
app.use(expressLayouts);

// Menggunakan middleware untuk menyajikan file statis dari direktori saat ini
app.use(express.static(__dirname));

// application level midleware
app.use((req, res, next) => {
    console.log('Time: ', Date.now());
    next();
});

// Middleware untuk mengizinkan penggunaan data POST
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser('secret'));
app.use(
    session({
        cookie: { maxAge: 6000},
        secret: 'secret',
        resave: true,
        saveUninitialized: true,
    })
);
app.use(flash());

// ====================================Dashboard Home ====================================
// Halaman utama
app.get('/', (req, res) => {
  res.render('index', {
    layout: 'layout/core-index',
    namaWeb: "Rafi'ul Huda",
    title: 'Aplikasi Penjualan',
  });
});

// Controller logout
app.get("/logout", async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect('/login');
    }
  });
});

// ====================================end Home ====================================

// =================================== Dashboard Admin dan user ===================================
// Dashboard route untuk admin
app.get("/dashboard-admin",async (req, res) => {
  const username = req.session.username || { email: "Guest", username: "Guest" };

  res.render("dashboard-admin", {
    title: "Dashboard",
    layout: "layout/main-layout",
    username: username,
  });
});

// Dashboard route untuk pengguna
app.get("/dashboard-user",async (req, res) => {
  try {
    const username = req.session.username || { email: "Guest", username: "Guest" };
    // Ambil data buku dari PostgreSQL
    const books = await fetchDataBook(); // Anda perlu menggantinya sesuai dengan fungsi atau metode pengambilan data dari database
    const users = await fetchDataUser();
    // Render halaman dengan data buku
    res.render("index-user", {
      title: "Dashboard",
      layout: "layout/user-layout",
      username: username,
      dataBuku: books,
      users
    });
  } catch (error) {
    console.error(error);
    // Tangani kesalahan, berikan respons atau redirect ke halaman lain
    res.status(500).send('Internal Server Error');
  }
});

// =================================== end ===================================


// =================================== LOGIN USER AND REGISTER ===================================

// Halaman login
app.get('/login', (req, res) => {
  res.render('login-user', {
    title: "Halaman Login", 
    layout: 'layout/login-layout',
  });
});

// Halaman login untuk pengguna
app.get("/login/user", (req, res) => {
  res.render("login-user", {
    title: "Search Book - Login",
    layout: "layout/login-layout",
  });
});

// Rute login
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  // Logika otentikasi pengguna
  if (await isValidCredentials(email, password)) {
    // Otentikasi berhasil sebagai pengguna
    req.session.username = { email: email, username: "CustomUsername" };
    return res.redirect(`/dashboard-user`);
  }

  // Logika otentikasi admin
  if (await isValidCredentialsUser(email, password)) {
    // Otentikasi berhasil sebagai admin
    req.session.username = { email: email, username: "CustomUsername" };
    return res.redirect(`/dashboard-admin`);
  }

  // Otentikasi gagal
  return res.redirect("/login");
});

// Fungsi validasi otentikasi pengguna
async function isValidCredentials(email, password) {
  try {
    const result = await pool.query("SELECT * FROM data_user WHERE email = $1", [email]);

    if (result.rows.length > 0) {
      const data_user = result.rows[0];
      const passwordMatch = await bcrypt.compare(password, data_user.password);
      return passwordMatch;
    } else {
      return false;
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}

// penanganan rute untuk halaman register
app.get('/register', (req, res) => {
  res.render('register-user', {
      title: "Halaman Register", 
      layout: 'layout/login-layout',
   });
});

// middleware untuk registrasi admin
app.post(
"/register",
[
  body("username").custom(async (value) => {
    const duplicateUser = await duplicateUsernameUser(value);
    if (duplicateUser) {
      throw new Error("User has been registered");
    }
    return true;
  }),
  body("nama").custom(async (value) => {
    const duplicate = await duplicateName(value);

    if (duplicate) {
      throw new Error("Name sudah digunakan");
    }
    return true;
  }),
  check("mobile", "mobile phone number invalid").isMobilePhone("id-ID"),
  body("email").custom(async (value) => {
    const emailDuplicate = await emailDuplicateUserCheck(value);
    if (emailDuplicate) {
      throw new Error("Email sudah digunakan");
    }
    return true;
  }),
  check("email", "Invalid email").isEmail(),
  body("password").custom(async (value) => {
    const duplicate = await duplicatePasswordAdmin(value);
    if (duplicate) {
      throw new Error("Password sudah digunakan");
    }
    return true;
  }),
],
async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {

    res.render("register-user", {
      title: "Search Book - Register Admin",
      layout: "layout/login-layout",
      errors: errors.array(),
    });
  } else {
    try {
      console.log("Data yang dikirim: ", req.body);

      // Gunakan fungsi addDataAdmin dari model basis data
      const addedUser = await addDataUser(
        req.body.username,
        req.body.nama,
        req.body.mobile,
        req.body.email,
        req.body.password
      );

      if (addedUser) {
        // Validasi panjang password
        if (req.body.password.length < 6) {
          req.flash(
            "passwordLengthError",
            "Password must be at least 6 characters"
          );
          res.redirect("/login");
          return;
        }

        req.flash(
          "successMessage",
          "Data added successfully and you can login now"
        );
      } else {
        throw new Error("Failed to add admin");
      }
    } catch (err) {
      console.error(err.message);
      req.flash("msg", err.message);
      res.status(500).redirect("/register");
      return;
    }
    res.redirect("/login");
  }
}
);

// =================================== end ===================================

// =================================== LOGIN Admin otentifikasi ===================================

// Fungsi validasi otentikasi admin
async function isValidCredentialsUser(email, password) {
  try {
    const result = await pool.query("SELECT * FROM data_admin WHERE email = $1", [email]);

    if (result.rows.length > 0) {
      const data_admin = result.rows[0];
      const passwordMatch = await bcrypt.compare(password, data_admin.password);
      return passwordMatch;
    } else {
      return false;
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}
// =================================== end ===================================

// =================================== Data Admin ===================================
// Penanganan rute untuk halaman data-admin
app.get('/data-admin', async (req, res) => {
  try {
    // Query ke database PostgreSQL
    const data = await fetchDataAdmin();
    res.render('admin/data-admin', {
            title: 'Search Book - Data Admin',
            data,
            msg: req.flash('msg'),
            layout: 'layout/main-layout',
        });
        
    }catch(err){
        console.error(err.message);
        res.render('admin/data-admin', {
            title: 'Seacrh Book - Data Admin',
            msg: 'Data Admin tidak tersedia.', // Pesan ketika data kosong
            layout: 'layout/main-layout',
            data: []
        });
    }
});

// add data-admin
app.get("/data-admin/add", (req, res) => {
  res.render("admin/add-admin", {
    title: "Search Book - Add Admin",
    layout: "layout/main-layout",
  });
});

// Tangani pengiriman formulir untuk menambahkan admin
app.post(
  "/data-admin/add",
  [
    body("username").custom(async (value) => {
      const duplicate = await duplicateName(value);
      if (duplicate) {
        throw new Error("username sudah terdaftar");
      }
      return true;
    }),
    body("email").custom(async (value) => {
      const emailDuplicate = await emailDuplicateCheck(value);
      if (emailDuplicate) {
        throw new Error("Email sudah terdaftar");
      }
      return true;
    }),
    check("email", "Invalid email").isEmail(),
    check("mobile", "nomor handphone anda salah").isMobilePhone("id-ID"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("admin/add-admin", {
        title: "Search Book - Add Admin",
        layout: "layout/main-layout",
        errors: errors.array(),
      });
    } else {
      try {

        // Gunakan fungsi addDataAdmin dari model basis data
        await addDataAdminku(
          // Ekstrak data dari tubuh permintaan
          // req.body.id_admin,
          req.body.username,
          req.body.nama,
          req.body.mobile,
          req.body.email,
          req.body.password
        );
        req.flash('msg', 'Data Admin Anda Berhasil ditambahkan!');

        // Redirect ke halaman data-admin untuk melihat data yang diperbarui
        res.redirect("/data-admin");
      } catch (err) {
        console.error(err.msg);
        req.flash("msg", "An error occurred while adding data");
        res.status(500);
      }
    }
  }
);

// update data-admin
app.get("/data-admin/update-admin/:username", async (req, res) => {
  try {
      const adminku = await searchDataAdmin(req.params.username);

      if (!adminku) {
          // Handle ketika data admin tidak ditemukan, misalnya redirect atau tampilkan pesan
          res.status(404).send("Data admin tidak ditemukan");
          return;
      }

      res.render("admin/update-admin", {
          title: "Seacrh Buku - Update Admin",
          titleadmin: "Seacrh Buku - Update Admin",
          layout: "layout/main-layout",
          adminku,
      });
  } catch (err) {
      console.error(err.msg);
      res.status(500).send("Terjadi kesalahan server");
  }
});


app.post(
  "/data-admin/update",
  [
    body("username").custom(async (value) => {
      const duplicate = await duplicateName(value);
      if (duplicate) {
        throw new Error("username sudah terdaftar");
      }
      return true;
    }),
    body("email").custom(async (value) => {
      const emailDuplicate = await emailDuplicateCheck(value);
      if (emailDuplicate) {
        throw new Error("Email sudah digunakan!");
      }
      return true;
    }),
    check("email", "Email tidak valid").isEmail(),
    check("mobile", "Ada yang salah dengan nomor telepon. Perbaiki lagi!").isMobilePhone(
      "id-ID"
    ),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("admin/update-admin", {
        title: "Search Buku - Update Admin",
        layout: "layout/main-layout",
        errors: errors.array(),
        adminku: req.body,
      });
    } else {
      try {
        await updateAdmin(req.body);
        req.flash("msg", "Data berhasil diupdate");
        res.redirect("/data-admin");
      } catch (err) {
        console.error(err.msg);
        res.status(500);
      }
    }
  }
);

// Detail data-admin
app.get("/data-admin/:username", async (req, res) => {
  try {
    // Ambil nilai username dari parameter route
    const adminUsername = req.params.username;

    // Ambil data admin (diasumsikan ini operasi asynchronous)
    const adminku = await fetchDataAdmin();

    // Temukan admin dengan username yang sesuai dengan adminUsername di data yang diambil
    const admin = adminku.find((data_admin) => data_admin.username === adminUsername);

    // Render view dengan detail admin jika admin ditemukan
    if (admin) {
      res.render("admin/data-admin", {
        title: "Search Book - Detail Admin",
        layout: "layout/main-layout",
        admin,
      });
    } else {
      // Tangani kasus ketika admin tidak ditemukan
      res.status(404).send("Admin tidak ditemukan");
    }
  } catch (err) {
    // Tangani error dengan mencetak pesan error ke konsol
    console.log(err.message);
    res.status(500).send("Kesalahan Server Internal");
  }
});

// data admin delete
app.get("/data-admin/delete-admin/:username", async (req, res) => {
  try {
    const deletedAdmin = await deleteDataAdmin(req.params.username);

    if (!deletedAdmin) {
      req.flash("msg", "Data not found or has been deleted");
    } else {
      req.flash("msg", "Data deleted successfully");
    }

    res.redirect("/data-admin");
  } catch (err) {
    console.error(err.msg);
    req.flash("msg", "An error occurred while deleting data.");
    res.redirect("/data-admin");
  }
});

// =================================== end ===================================

// =================================== Data User ===================================

// Penanganan rute untuk halaman data user
app.get('/data-user', async (req, res) => {
  try {
    // Query ke database PostgreSQL
    const datauser = await fetchDataUser(); // Corrected variable name
    res.render('user/data-user', {
      title: 'Search Book - Data User',
      datauser: datauser, // Corrected variable name
      msg: req.flash('msg'),
      layout: 'layout/main-layout',
    });
        
  } catch (err) {
    console.error(err.message);
    res.render('user/data-user', {
      title: 'Search Book - Data User',
      msg: 'Data User tidak tersedia.', // Pesan ketika data kosong
      layout: 'layout/main-layout',
      datauser: []
    });
  }
});


app.get("/data-user/update-user/:username", async (req, res) => {
  try {
      const users = await searchUser(req.params.username);

      if (!users) {
          // Handle ketika data admin tidak ditemukan, misalnya redirect atau tampilkan pesan
          res.status(404).send("Data admin tidak ditemukan");
          return;
      }

      res.render("user/update-user", {
          title: "Seacrh Buku - Update Admin",
          layout: "layout/main-layout",
          users,
      });
  } catch (err) {
      console.error(err.msg);
      res.status(500).send("Terjadi kesalahan server");
  }
});

  
app.post(
    "/data-user/update",
    [
      body("username").custom(async (value) => {
        const duplicate = await duplicateName(value);
        if (duplicate) {
          throw new Error("username sudah terdaftar");
        }
        return true;
      }),
      check("mobile", "Ada yang salah dengan nomor telepon").isMobilePhone(
        "id-ID"
      ),
      body("email").custom(async (value) => {
        const emailDuplicate = await emailDuplicateUserCheck(value);
        if (emailDuplicate) {
          throw new Error("Email sudah digunakan");
        }
        return true;
      }),
      check("email", "Invalid email").isEmail()
    ],
    async (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        
        res.render("user/update-user", {
          title: "Seacrh Book - Update User",
          layout: "layout/main-layout",
          errors: errors.array(),
          users: req.body,
        });
      } else {
        try {
          console.log(req.body.id_user)
          await updateUser(req.body);
          console.log("Data berhasil diupdate:", req.body);
          req.flash("msg", "Data berhasil di update");
          res.redirect("/data-user");
        } catch (err) {
          console.error(err.msg);
          res.status(500);
        }
      }
    }
  );

  
  // proses delete data-user
app.get('/data-user/delete-user/:username',async (req, res) =>{
    try{
        const users = await deleteDataUser(req.params.username)

        // jika data-user tidak ada
        if(!users){
            res.status(404);
            res.status('<h1>404</h1>');
        }else{
            await deleteDataUser(req.params.username);
            req.flash('msg', 'Data User Anda Berhasil dihapuskan!');
            res.redirect('/data-user');
        }
    }catch(err){
        console.error(err.message);
        res.status(500).send("<h1>internal server error</h1>");
    }
});


// add data-user
app.get("/data-user/add", (req, res) => {
  res.render("user/add-user", {
    title: "Search Book - Add Admin",
    layout: "layout/main-layout",
  });
});

// Tangani pengiriman formulir untuk menambahkan user
app.post(
  "/data-user/add",
  [
    body("username").custom(async (value) => {
      const duplicate = await duplicateName(value);
      if (duplicate) {
        throw new Error("username sudah terdaftar");
      }
      return true;
    }),
    body("email").custom(async (value) => {
      const emailDuplicate = await emailDuplicateCheck(value);
      if (emailDuplicate) {
        throw new Error("Email sudah terdaftar");
      }
      return true;
    }),
    check("email", "Invalid email").isEmail(),
    check("mobile", "nomor handphone anda salah").isMobilePhone("id-ID"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("user/add-user", {
        title: "Search Book - Add Admin",
        layout: "layout/main-layout",
        errors: errors.array(),
      });
    } else {
      try {

        // Gunakan fungsi addDataAdmin dari model basis data
        await addDataUser(
          // Ekstrak data dari tubuh permintaan
          // req.body.id_user,
          req.body.username,
          req.body.nama,
          req.body.mobile,
          req.body.email,
          req.body.password
        );
        req.flash('msg', 'Data User Anda Berhasil ditambahkan!');

        // Redirect ke halaman data-admin untuk melihat data yang diperbarui
        res.redirect("/data-user");
      } catch (err) {
        console.error(err.msg);
        req.flash("msg", "An error occurred while adding data");
        res.status(500);
      }
    }
  }
);

// penanganan detail user
app.get("/data-user/:username", async (req, res) => {
  try {
    // Ambil nilai username dari parameter route
    const userUsername = req.params.username;

    // Ambil data admin (diasumsikan ini operasi asynchronous)
    const users = await fetchDataAdmin();

    // Temukan admin dengan username yang sesuai dengan adminUsername di data yang diambil
    const user = users.find((data_user) => data_user.username === userUsername);

    // Render view dengan detail admin jika admin ditemukan
    if (user) {
      res.render("user/data-user", {
        title: "Search Book - Detail Admin",
        layout: "layout/main-layout",
        user,
      });
    } else {
      // Tangani kasus ketika admin tidak ditemukan
      res.status(404).send("Admin tidak ditemukan");
    }
  } catch (err) {
    // Tangani error dengan mencetak pesan error ke konsol
    console.log(err.message);
    res.status(500).send("Kesalahan Server Internal");
  }
});

// =================================== end ===================================

// =================================== Data Buku ===================================

// halaman data-buku
app.get('/data-buku', async (req, res) => {
  try {
    // Ambil data buku dari PostgreSQL
    const books = await fetchDataBook(); // Anda perlu menggantinya sesuai dengan fungsi atau metode pengambilan data dari database

    // Render halaman dengan data buku
    res.render('product/data-buku', { 
      dataBuku: books, 
      title: "Search Book - Data Buku", 
      layout: "layout/main-layout" });
  } catch (error) {
    console.error(error);
    // Tangani kesalahan, berikan respons atau redirect ke halaman lain
    res.status(500).send('Internal Server Error');
  }
});

app.get('/data-buku/add', async (req, res) => {
  res.render("product/add-buku", {
    title: "Search Book - Add Buku",
    layout: "layout/main-layout",
    msg: req.flash("msg", )
  })
});
const storage = uploader.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./public/assets2/img"); // Corrected the destination path
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + "-" + uniqueSuffix + "." + file.mimetype.split("/")[1]); // Corrected the callback function
  },
});

const upload = uploader({
  storage: storage, // Corrected the assignment operator
});

app.post('/data-buku/add', upload.single("image_buku"), [
  body("category").notEmpty().withMessage("Category is required"),
  body("title").custom(async(value) => {
    const nameDuplicate = await duplicateBooksName(value);
    if(nameDuplicate){
      throw new Error("Product has been registered");
    }
    return true;
  }),
], async (req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    // Handle Validation errrors
  }else {
    try {
      if (!req.file) {
        req.body.image = "default.png";
      } else {
        if (!/^image/.test(req.file.mimetype)) {
          req.flash("msg", "File harus berupa gambar");
          return res.redirect("/data-buku");
        }
        req.body.image = req.file.filename;
      }
      const category = req.body.category || " ";
      await addDataBook(
        req.body.title,
        req.body.deksripsi,
        category,
        req.body.penerbit,
        req.body.pengarang,
        req.body.harga,
        req.body.jumlah,
        req.file.filename,
      );
      req.flash("msg", "Data added successfully");
      res.redirect("/data-buku");
      res.render('product/update-buku', {
        title: 'Seacrh Book - Update Admin',
        layout: 'layout/main-layout',
        books, // Tambahkan data buku yang diperbarui
      });
    } catch (err) {
      console.error(err);
      req.flash("msg", "An error occurred while adding data");
      return res.status(500).send("<h1>Internal Server Error</h1>");
    }
  }
}
);

// proses delete data-user
app.get('/data-buku/delete-buku/:title',async (req, res) =>{
  try{
      const users = await deleteDataBooks(req.params.title)

      // jika data-user tidak ada
      if(!users){
          res.status(404);
          res.status('<h1>404</h1>');
      }else{
          await deleteDataBooks(req.params.title);
          req.flash('msg', 'Data Buku Anda Berhasil dihapuskan!');
          res.redirect('/data-buku');
      }
  }catch(err){
      console.error(err.message);
      res.status(500).send("<h1>internal server error</h1>");
  }
});

app.get("/detail-buku/:id_buku", async (req, res) => {
  try {
    // Ambil data buku (diasumsikan ini operasi asynchronous)
    const books = await fetchDataBook();

    // Render view dengan detail buku jika buku ditemukan
    if (books && books.length > 0) {
      res.render("product/detail-buku", {
        title: "Search Book - Detail Buku",
        layout: "layout/user-layout",
        dataBuku : books,
      });
    } else {
      // Tangani kasus ketika buku tidak ditemukan
      res.status(404).send("Buku tidak ditemukan");
    }
  } catch (err) {
    // Tangani error dengan mencetak pesan error ke konsol
    console.log(err.message);
    res.status(500).send("Kesalahan Server Internal");
  }
});

app.get("/data-buku/update-buku/:id_buku", async (req, res) => {
  try {
      const books = await searchBooks(req.params.id_buku);
      
      res.render("product/update-buku", {
          title: "Seacrh Buku - Update Admin",
          layout: "layout/main-layout",
          books : books,
          
    });
  } catch (err) {
      console.error(err.msg);
      res.status(500).send("Terjadi kesalahan server");
  }
});


// Rute untuk menangani pembaruan buku
app.post('/data-buku/update-buku', upload.single('image_buku'), [
  body('category').notEmpty().withMessage('Category is required'),
  // Tambahkan validasi sesuai kebutuhan untuk bidang lainnya
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Handle Validation errors
  } else {
    try {
      // Ambil data buku berdasarkan judul
      const existingBook = await searchBooks(req.params.title);

      if (!existingBook) {
        // Handle case when book is not found
        req.flash('msg', 'Buku tidak ditemukan');
        return res.redirect('/data-buku');
      }

      // Handle image update
      if (req.file) {
        if (!/^image/.test(req.file.mimetype)) {
          req.flash('msg', 'File harus berupa gambar');
          return res.redirect('/data-buku');
        }
        existingBook.image = req.file.filename;
      }

      // Update data buku
      await updateBooks(
        req.params.title,
        req.body.deksripsi,
        category,
        req.body.penerbit,
        req.body.pengarang,
        req.body.harga,
        req.body.jumlah,
        req.file.filename,
      );

      req.flash('msg', 'Data buku berhasil diperbarui');
      res.redirect('/data-buku');
    } catch (err) {
      console.error(err);
      req.flash('msg', 'Terjadi kesalahan saat memperbarui data buku');
      return res.status(500).send('<h1>Internal Server Error</h1>');
    }
  }
});

app.get("/buku-pendidikan",async (req, res) => {
  try {
    const books = await fetchDataBook(); // Anda perlu menggantinya sesuai dengan fungsi atau metode pengambilan data dari database
    // const users = await fetchDataUser();
    // Render halaman dengan data buku
    res.render("product/buku-pendidikan", {
      title: "Seacrh Book - Buku Pendidikan",
      layout: "layout/user-layout",
      dataBuku: books,
    });
  } catch (error) {
    console.error(error);
    // Tangani kesalahan, berikan respons atau redirect ke halaman lain
    res.status(500).send('Internal Server Error');
  }
});

// =================================== end ===================================

// =================================== cart ===================================

app.get("/cart", async (req, res) => {
  try {
    const book = await fetchDataBook(); // Anda perlu menggantinya sesuai dengan fungsi atau metode pengambilan data dari database
    // const users = await fetchDataUser();
    // Render halaman dengan data buku
    res.render("cart", {
      title: "Seacrh Book - Keranjang",
      layout: "layout/user-layout",
      book,
    });
  } catch (error) {
    console.error(error);
    // Tangani kesalahan, berikan respons atau redirect ke halaman lain
    res.status(500).send('Internal Server Error');
  }
});



// Penanganan rute untuk permintaan yang tidak cocok dengan rute lainnya (404 Not Found)
app.use('/', (req, res) => {
    res.status(404);
    res.send('page not found: 404');
});



// Server mendengarkan permintaan pada port yang telah ditentukan
app.listen(port, () => {
    // Pesan ini akan dicetak saat server berjalan
    console.log(`Server berjalan di http://localhost:${port}/`);
});