const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Set up storage for multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 } }); // Limit file size to 5MB

app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/upload', upload.single('ktp'), (req, res) => {
    if (!req.file) {
        return res.status(400).send('No file uploaded.');
    }

    const filePath = req.file.path;

    Tesseract.recognize(
        filePath,
        'eng',
        {
            logger: info => console.log(info)
        }
    ).then(({ data: { text } }) => {
        // Validasi teks
        if (text.includes("REPUBLIK INDONESIA") || text.includes("NIK")) {
            res.send('Upload KTP berhasil dan valid.');
        } else {
            res.send('Bukan foto KTP!');
        }
    }).catch(err => {
        console.error(err);
        res.status(500).send('Error processing the image.');
    }).finally(() => {
        // Hapus file setelah diproses
        fs.unlink(filePath, (err) => {
            if (err) console.error('Error deleting file:', err);
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
