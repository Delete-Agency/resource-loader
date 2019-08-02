const express = require('express');
const app = express();
const port = 3001;

app.get('/resources/counter.js', function (req, res, next) {
    setTimeout(() => {
        const fileName = 'counter.js';
        res.sendFile(fileName, {
            root: './examples/resources',
            dotfiles: 'deny',
        }, function (err) {
            if (err) {
                next(err)
            } else {
                console.log('Sent:', fileName)
            }
        })
    }, 5000);
});

app.use(express.static('examples'));
app.use(express.static('build'));

app.listen(port);