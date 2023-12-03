// Mengimpor modul Express.js
const express = require('express');

const expressLayouts = require('express-ejs-layouts'); // Mengimpor modul express-ejs-layouts

// Menginisialisasi aplikasi Express
const app = express();
const path = require('path');

// Menentukan port yang akan digunakan
const port = 3000;

// Mengatur EJS sebagai template engine
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

app.use(express.urlencoded({ extended: true }));


// Penanganan rute untuk halaman utama
app.get('/', (req, res) => {
    res.render('index', {
        layout: 'layouts/main-layouts',
        namaWeb: "Rafi'ul Huda",
        title: 'Aplikasi Penjualan',
    });
});

// Penanganan rute untuk halaman about
app.get('/login', (req, res) => {
    res.render('login', {
        title: "Halaman Login", 
        layout: 'layouts/login-layouts',
     });
});

// Penanganan rute untuk autentikasi (post request dari form login)
app.post('/login', (req, res) => {
    // Handle login logic here
    const { email, password } = req.body;
    
    // Anda harus memeriksa basis data atau menyimpan informasi pengguna secara aman
    // Di sini, hanya contoh sederhana untuk keperluan ilustrasi
    if (email === 'user@gmail.com' && password === '12345') {
        // Jika login berhasil untuk user
        res.redirect('/');
    } else if (email === 'admin@gmail.com' && password === '24689') {
        // Jika login berhasil untuk admin
        res.redirect('/');
    } else {
        // Jika kredensial tidak valid, tampilkan pesan atau kembali ke halaman login
        res.send('Invalid credentials');
    }
});
  
app.get('/Register', (req, res) => {
    res.render('register', {
        title: "Halaman Register", 
        layout: 'layouts/login-layouts',
     });
});

app.post('/login/register', (req, res) => {
    // Handle registration logic here
    const { email, password } = req.body;

    // Check if the email is already registered
    const isEmailRegistered = users.some(user => user.email === email);

    if (isEmailRegistered) {
        // If the email is already registered, send a message to the user
        res.render('register', {
            title: 'Halaman Register',
            layout: 'layouts/login-layouts',
            errorMessage: 'Email sudah terdaftar. Gunakan email lain.',
        });
    } else {
        // If the email is not registered, save the user data (in this example, it's just an array)
        users.push({ email, password });

        // Redirect the user to the login page or dashboard
        res.redirect('/login');
    }
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
            layout: 'layouts/main-layouts',
        });
    }
});
// Penanganan rute untuk halaman contact
app.get('/data-user', (req, res) => {
    const dataUser = [
        {
            nama: "Huda",
            mobile: "081283288111",
            email: "huda@gmail.com"
        },
        {
            nama: "Rafi",
            mobile: "081283288111",
            email: "rafiul@gmail.com"
        },
        {
            nama: "adinda",
            mobile: "081283288111",
            email: "adinda@gmail.com"
        }
    ]; 
    
    // Memeriksa apakah ada data kontak
    if (dataUser.length === 0) {
        // Jika tidak ada, menampilkan pesan bahwa belum ada kontak yang tersedia
        res.render('user/data-user', {
            message: 'Maaf, Belum ada daftar kontak yang tersedia.'
        });
    } else {
        // Jika ada, menampilkan data kontak di halaman kontak
        res.render('user/data-user', {
            title: "Aplikasi Penjualan",
            datauser: dataUser,
            user: "Web Menu - Data User",
            layout: 'layouts/main-layouts',
        });
    }
});


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
            layout: 'layouts/product-layouts',
        });
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