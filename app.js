// Mengimpor modul Express.js
const express = require('express');

const expressLayouts = require('express-ejs-layouts'); // Mengimpor modul express-ejs-layouts
const { body, check, validationResult } = require('express-validator');

const {
    fetchDataAdmin,
    addDataAdminku,
    deleteDataAdminku,
    fetchDataAdminById,
    checkIdDataAdmin,
    duplicateIdCheck,
    searchDataAdmin,
    emailDuplicateCheck,
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
} = require("./models/data_user");

// Menginisialisasi aplikasi Express
const app = express();
const path = require('path');
const pool = require('./models/db');

const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');


// Menentukan port yang akan digunakan
const port = 3000;

// Mengatur EJS sebagai template engine
app.set("layout", "layouts/main-layouts");
app.set('view engine', 'ejs');


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
        layout: 'layout/main-layout',
        namaWeb: "Rafi'ul Huda",
        title: 'Aplikasi Penjualan',
    });
});



// Penanganan rute untuk halaman data-admin
app.get('/data-admin', async (req, res) => {
  try {
    // Query ke database PostgreSQL
    const data = await fetchDataAdmin();
    if (data.length === 0) {
      res.render('admin/data-admin', {
        msg: req.flash("msg")
      });
    } else {
      res.render('admin/data-admin', {
        title: 'Aplikasi Penjualan',
        dataAdmin: data,
        titleadmin: 'Search Book - Data Admin',
        layout: 'layout/main-layout',
      });
    }
  } catch (error) {
    console.error('Error fetching data from PostgreSQL:', error);
    res.status(500).send('Internal Server Error');
  }
});

// update data-admin
app.get("/data-admin/update-admin/:id_admin", async (req, res) => {
  try {
    const adminku = await searchDataAdmin(req.params.id_admin);
    res.render("admin/update-admin", {
      title: "Seacrh Book - Update Admin",
      layout: "layout/main-layout",
      adminku,
    });
  } catch (err) {
    console.error(err.msg);
    res.status(500);
  }
});

app.post(
  "/data-admin/update",
  [
    body("id_admin").custom(async (value, { req }) => {
      const duplicate = await duplicateName(value);
      if (value !== req.body.oldName && duplicate) {
        return Promise.reject("Name sudah digunakan!");
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
    check("email", "Invalid email").isEmail(),
    check("mobile", "Ada yang salah dengan nomor telepon. perbaiki lagi!").isMobilePhone(
      "id-ID"
    ),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.render("admin/update-admin", {
        title: "Search Book - Update Admin",
        layout: "layout/main-layout",
        errors: errors.array(),
        adminku: {
          oldName: req.body.oldName,
          id_admin: req.body.id_admin,
          email: req.body.email,
          mobile: req.body.mobile,
          // Tambahkan properti lain sesuai kebutuhan
        },
      });
    } else {
      try {
        await updateAdmin(req.body);
        req.flash("msg", "Data berhasil di update");
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
          title: 'Aplikasi Penjualan',
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

  // proses delete data-user
app.get('/data-user/delete-user/:id_user',async (req, res) =>{
    try{
        const users = await searchUser(req.params.id_user)

        // jika contact tidak ada
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
            kode: "KB001",
            judul: "Harry Potter",
            kategori: "Fiksi",
            penerbit: "Erlangga",
            pengarang: "Rafi",
            harga: "Rp. 15.000",
            jumlah: "12",
        },
        {
            kode: "KB002",
            judul: "Naruto",
            kategori: "Fiksi",
            penerbit: "Erlangga",
            pengarang: "Yayan",
            harga: "Rp. 10.000",
            jumlah: "14",
        },
        {
            kode: "KB003",
            judul: "Teknik Informatika",
            kategori: "Technology",
            penerbit: "Erlangga",
            pengarang: "nanang",
            harga: "Rp. 16.000",
            jumlah: "14",
        },
        {
            kode: "KB004",
            judul: "Sistem Informasi",
            kategori: "Pendidikan",
            penerbit: "Erlangga",
            pengarang: "Kasman",
            harga: "Rp. 18.000",
            jumlah: "17",
        },
        {
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


// Penanganan rute untuk halaman login
app.get('/login', (req, res) => {
    res.render('login', {
        title: "Halaman Login", 
        layout: 'layout/login-layout',
     });
});

// penanganan rute untuk halaman register
app.get('/Register', (req, res) => {
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