// Mengimpor modul Express.js
const express = require('express');
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');


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
    duplicatePasswordUser
} = require("./models/data_user");

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


// Penanganan rute untuk halaman utama
app.get('/', (req, res) => {
    res.render('index', {
        layout: 'layout/core-index',
        namaWeb: "Rafi'ul Huda",
        title: 'Aplikasi Penjualan',
    });
});

// halaman login untuk admin ketika udh register
app.get("/login/admin", (req, res) => {
  res.render("login-admin", {
    title: "Search Book - Login",
    layout: "layout/login-layout",
  });
});


// Penanganan rute untuk halaman login
app.get('/login', (req, res) => {
  res.render('login', {
      title: "Halaman Login", 
      layout: 'layout/login-layout',
   });
});

// Assuming a login form with 'email' and 'password' fields
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Perform authentication logic here
  if (isValidCredentials(email, password)) {
      // Authentication successful
      res.redirect(`/dashboard`);
  } else {
      // Authentication failed
      res.redirect("/login"); // Redirect back to the login page or handle accordingly
  }
});

async function isValidCredentials(email, password) {
  try {
    const result = await pool.query("SELECT * FROM data_admin WHERE email = $1", [
      email,
    ]);

    if (result.rows.length > 0) {
      const data_admin = result.rows[0];

      // Menggunakan bcrypt untuk memeriksa kecocokan password
      const passwordMatch = await bcrypt.compare(password, data_admin.password);

      return passwordMatch;
    } else {
      return false; // Tidak ada pengguna dengan email tersebut
    }
  } catch (error) {
    console.error(error);
    throw error;
  }
}
// Dashboard route
app.get("/dashboard", (req, res) => {
  const username = req.session.username || { email: "Guest", username: "Guest" };

  res.render("dashboard", {
      title: "Dashboard",
      layout: "layout/main-layout",
      username: username,
  });
});

// middleware untuk registrasi admin
app.post(
  "/register",
  [
    body("username").custom(async (value) => {
      const duplicateUser = await duplicateUserName(value);
      if (duplicateUser) {
        throw new Error("User has been registered");
      }
      return true;
    }),
    body("nama").custom(async (value) => {
      const duplicate = await duplicateUserName(value);

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
      const duplicate = await duplicatePasswordUser(value);
      if (duplicate) {
        throw new Error("Password sudah digunakan");
      }
      return true;
    }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("layout/register", {
        title: "Search Book - Register Admin",
        layout: "layout/login-layout",
        errors: errors.array(),
      });
    } else {
      try {
        console.log("Data yang dikirim: ", req.body);

        // Gunakan fungsi addDataAdmin dari model basis data
        const addedAdmin = await addDataAdminku(
          req.body.username,
          req.body.nama,
          req.body.mobile,
          req.body.email,
          req.body.password
        );

        if (addedAdmin) {
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


// delete data-admin / by ID
app.get("/data-admin/delete-admin/:id_admin", async (req, res) => {
  try {
    const deletedDataAdmin = await deleteDataAdminku(req.params.id_admin);

    if (!deletedDataAdmin) {
      req.flash("msg", "Data tidak ditemukan atau telah dihapus");
    } else {
      req.flash("msg", "Data berhasil di hapus");
    }

    res.redirect("/data-admin");
  } catch (err) {
    console.error(err.msg);
    req.flash("msg", "Terjadi kesalahan saat menghapus data.");
    res.redirect("/data-admin");
  }
});

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




// Penanganan rute untuk halaman data user
app.get('/data-user', async (req, res) => {
    try {
      const dataUser = await fetchDataUser();
  
      if (dataUser.length === 0) {
        res.render('user/data-user', {
          message: 'Maaf, belum ada data user yang tersedia.',
        });
      } else {
        res.render('user/data-user', {
          title: 'Seacrh Book - Data User',
          datauser: dataUser,
          layout: 'layout/main-layout',
        });
      }
    } catch (error) {
      console.error('Error fetching data from PostgreSQL:', error);
      res.status(500).send('Internal Server Error');
    }
  });

// update data-user
app.get("/data-user/update-user/:id_user", async (req, res) => {
    try {
      const users = await searchUser(req.params.id_user);
      res.render("user/update-user", {
        users: users,
        title: "Search Book - Update User",
        layout: "layout/main-layout",
        users,
      });
    } catch (err) {
      console.error(err.msg);
      res.status(500);
    }
  });
  
app.post(
    "/data-user/update",
    [
      body("id_user").custom(async (value, { req }) => {
        const duplicate = await duplicateUserName(value);
        if (value !== req.body.oldName && duplicate) {
          throw new Error("Name anda sudah digunakan");
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
          await updateUser(req.body);
          req.flash("msg", "Data berhasil di update");
          res.redirect("/data-user");
        } catch (err) {
          console.error(err.msg);
          res.status(500);
        }
      }
    }
  );

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

  // proses delete data-user
app.get('/data-user/delete-user/:username',async (req, res) =>{
    try{
        const users = await searchUser(req.params.id_user)

        // jika data-user tidak ada
        if(!users){
            res.status(404);
            res.status('<h1>404</h1>');
        }else{
            await deleteDataUser(req.params.id_user);
            req.flash('msg', 'Data User Anda Berhasil dihapuskan!');
            res.redirect('/data-user');
        }
    }catch(err){
        console.error(err.message);
        res.status(500).send("<h1>internal server error</h1>");
    }
}) 

// Dalam rute data-buku
app.get('/data-buku', (req, res) => {
    const databuku = [
        {
            gambar: 'images/Harry_potter.jpg',
            kode: "KB001",
            judul: "Harry Potter",
            kategori: "Fiksi",
            penerbit: "Erlangga",
            pengarang: "Rafi",
            harga: "Rp. 15.000",
            jumlah: "12",
        },
        {
          gambar: 'images/micsrosoft excel.jpg',
            kode: "KB002",
            judul: "Naruto",
            kategori: "Fiksi",
            penerbit: "Erlangga",
            pengarang: "Yayan",
            harga: "Rp. 10.000",
            jumlah: "14",
        },
        {
          gambar: 'images/micsrosoft office 2010.jpg',
            kode: "KB003",
            judul: "Teknik Informatika",
            kategori: "Technology",
            penerbit: "Erlangga",
            pengarang: "nanang",
            harga: "Rp. 16.000",
            jumlah: "14",
        },
        {
          gambar: 'images/micsrosoft office2007.jpg',
            kode: "KB004",
            judul: "Sistem Informasi",
            kategori: "Pendidikan",
            penerbit: "Erlangga",
            pengarang: "Kasman",
            harga: "Rp. 18.000",
            jumlah: "17",
        },
        {
          gambar: 'images/Harry_potter.jpg',
            kode: "KB005",
            judul: "Ilmu Pengetahuan Alam",
            kategori: "Pendidikan",
            penerbit: "Erlangga",
            pengarang: "samsudin",
            harga: "Rp. 15.000",
            jumlah: "10",
        },
    ];

    // Checking if there is any book data
    if (databuku.length === 0) {
        // If there is no data, render a message
        res.render('product/data-buku', {
            message: 'Maaf, Belum ada daftar data buku yang tersedia.'
        });
    } else {
        // If there is data, render the template with book data
        res.render('product/data-buku', {
            title: "Data Buku",
            dataBuku: databuku, // Pastikan menggunakan nama variabel yang benar di sini
            number: "Web Menu - Data Buku",
            layout: 'layout/product-layout',
        });
    }
});



// penanganan rute untuk halaman register
app.get('/register', (req, res) => {
    res.render('register', {
        title: "Halaman Register", 
        layout: 'layout/login-layout',
     });
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