// Mengimpor modul Express.js
const express = require('express');

const expressLayouts = require('express-ejs-layouts'); // Mengimpor modul express-ejs-layouts
const { body, check, validationResult } = require('express-validator');

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
} = require("./models/server_user");

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



// Penanganan rute untuk halaman contact
app.get('/data-admin', (req, res) => {
    const data = [
        {
            nama: "Rafi'ul Huda",
            mobile: "081283288739",
            email: "rafiulhuda@gmail.com"
        },
        {
            nama: "Rafiul",
            mobile: "081283288789",
            email: "rafiul@gmail.com"
        },
        {
            nama: "Raya Adinda Jayadi Ahmad",
            mobile: "081283288773",
            email: "raya@gmail.com"
        }
    ]; 
    
    // Memeriksa apakah ada data kontak
    if (data.length === 0) {
        // Jika tidak ada, menampilkan pesan bahwa belum ada kontak yang tersedia
        res.render('admin/data-admin', {
            message: 'Maaf, Belum ada daftar kontak yang tersedia.'
        });
    } else {
        // Jika ada, menampilkan data kontak di halaman kontak
        res.render('admin/data-admin', {
            title: "Aplikasi Penjualan",
            dataAdmin: data,
            titleadmin: "Web Menu - Data Admin",
            layout: 'layout/main-layout',
        });
    }
});
// Penanganan rute untuk halaman data user
app.get('/data-user', async (req, res) => {
    try {
      // Query ke database PostgreSQL
      const result = await pool.query('SELECT * FROM data_user');
  
      // Mengambil hasil query
      const dataUser = result.rows;
  
      if (dataUser.length === 0) {
        res.render('user/data-user', {
          message: 'Maaf, belum ada data user yang tersedia.',
        });
      } else {
        res.render('user/data-user', {
          title: 'Aplikasi Penjualan',
          datauser: dataUser,
          user: 'Search - Data User',
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

  // proses delete contact
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

  


// Dalam rute Express Anda
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


// Penanganan rute untuk halaman about
app.get('/login', (req, res) => {
    res.render('login', {
        title: "Halaman Login", 
        layout: 'layout/login-layout',
     });
});

  
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