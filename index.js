require('dotenv').config();

const express = require('express');
const axios = require('axios');
const bcrypt = require('bcrypt');
const { Sequelize, DataTypes } = require('sequelize');

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

// Database configuration
const sequelize =
    process.env.NODE_ENV !== 'test'
        ? new Sequelize(process.env.DATAB_NAME, process.env.DATAB_USER, process.env.DATAB_PASS, {
              host: process.env.DATAB_HOST,
              dialect: 'mysql',
              logging: false,
          })
        : new Sequelize('sqlite::memory:', { logging: false }); 

const User = sequelize.define('User', {
    email: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    first_name: {
        type: DataTypes.STRING,
    },
    last_name: {
        type: DataTypes.STRING,
    },
    account_created: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    account_updated: {
        type: DataTypes.DATE,
    },
}, {
    timestamps: false,
});

// Bootstrap database
const bootstrapDatabase = async () => {
    if (process.env.NODE_ENV !== 'test') {
        try {
            await sequelize.authenticate();
            await sequelize.sync({ force: true });
            console.log('Database connected');
        } catch (error) {
            console.error('Unable to connect to the database:', error);
        }
    } else {
        await sequelize.sync({ force: true }); 
    }
};

app.get('/healthz', async (req, res) => {
    try {
        await sequelize.query('SELECT 1 + 1 AS result');
        res.status(200).send('OK');
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(503).send('Service Unavailable');
    }
});

app.post('/v1/users', async (req, res) => {
    const { email, password, first_name, last_name } = req.body;

    if (!email || !password || !first_name || !last_name) {
        return res.status(400).send('All fields are required.');
    }

    if (password.length < 8) {
        return res.status(400).send('Password must be at least 8 characters long.');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).send('Check the email format.');
    }

    try {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).send('User already exists with this email.');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        
        const newUser = await User.create({ email, password: hashedPassword, first_name, last_name });

        return res.status(201).json({ id: newUser.id, email: newUser.email, first_name, last_name });
    } catch (error) {
        console.error('Error creating user:', error);
        return res.status(500).send('Internal Server Error');
    }
});
const Authenticateuser = async (req, res, next) => {
    const { authorization } = req.headers;

    const credentials = Buffer.from(authorization.split(' ')[1], 'base64').toString('ascii');
    const [email, password] = credentials.split(':');

    if (!email || !password) {
        return res.status(401).json({ message: 'Email or password is missing' });
    }

    try {
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ message: 'Invalid username' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid password' });
        }

       
        req.user = user;
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
};

app.get('/v1/users/self', Authenticateuser, (req, res) => {
    const { id, email, first_name, last_name } = req.user;
    res.status(200).json({ id, email, first_name, last_name });
});

app.put('/v1/users/self', Authenticateuser, async (req, res) => {
    const { first_name, last_name, password } = req.body;

    if (!first_name && !last_name && !password) {
        return res.status(400).send('Nothing to update.');
    }

    try {
        let updated = false;

        if (first_name && first_name !== req.user.first_name) {
            req.user.first_name = first_name;
            updated = true;
        }

        if (last_name && last_name !== req.user.last_name) {
            req.user.last_name = last_name;
            updated = true;
        }

        if (password) {
            if (password.trim() === '') {
                return res.status(400).send('Password must be a non-empty string.');
            }
            if (password.length < 8) {
                return res.status(400).send('Password must be at least 8 characters long.');
            }
            req.user.password = await bcrypt.hash(password, 10);
            updated = true;
        }

        if (updated) {
            req.user.account_updated = new Date();
            await req.user.save();
        } else {
            return res.status(400).send('No changes made.');
        }

        const { id, email } = req.user;
        res.status(200).json({ id, email, first_name: req.user.first_name, last_name: req.user.last_name });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).send('Server error.');
    }
});

app.all('/v1/users', (req, res) => {
const Method_not_allowed2 = req.method !== 'POST';
if (Method_not_allowed2) {
    res.status(405).send();  
}
});

app.all('/v1/users/self', (req, res) => {
const Method_not_allowed3 = req.method !== 'PUT' && req.method !== 'GET';
if (Method_not_allowed3) {
    res.status(405).send();  
}
});


app.listen(port, async () => {
    await bootstrapDatabase();
    console.log(`Server running on port ${port}`);
});


module.exports = { app, User };
