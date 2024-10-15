import 'dotenv/config';
import express from 'express';
import axios from 'axios';
import bcrypt from 'bcrypt';
import { Sequelize, DataTypes } from 'sequelize';

const application = express();
const serverPort = process.env.PORT || 8080;

application.use(express.json());

const validateQueryParams = (req, res, next) => {
    if (Object.keys(req.query).length > 0) {
        return res.status(400).json({ error: 'Query parameters are not allowed' });
    }
    next();
};

const databaseConnection = new Sequelize(process.env.DATABASE_NAME, process.env.DATABASE_USERNAME, process.env.DATABASE_PASSWORD, {
    host: process.env.DATABASE_HOST,
    dialect: 'mysql',
    logging: false,
});

const UserModel = databaseConnection.define('User', {
    emailAddress: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: false,
    },
    userPassword: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    givenName: {
        type: DataTypes.STRING,
    },
    surname: {
        type: DataTypes.STRING,
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updatedAt: {
        type: DataTypes.DATE,
    },
}, {
    timestamps: false,
});

const initializeDatabase = async () => {
    try {
        await databaseConnection.authenticate();
        console.log('Database connected');

        if (process.env.NODE_ENV === 'development') {
            await databaseConnection.sync({ force: true });
        } else if (process.env.NODE_ENV === 'test') {
            await databaseConnection.sync({ force: false });
        }
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
};

const verifyDatabaseConnection = async () => {
    try {
        await databaseConnection.query('SELECT 1 + 1 AS result');
        return true;
    } catch (error) {
        console.error('Database connection error:', error);
        return false;
    }
};

const checkExternalAPI = async () => {
    try {
        const response = await axios.get('https://jsonplaceholder.typicode.com/posts/1');
        return response.status === 200;
    } catch (err) {
        console.error('External API call failed:', err);
        return false;
    }
};

const basicAuthentication = async (req, res, next) => {
    const authorizationHeader = req.headers['authorization'];
    if (!authorizationHeader) return res.sendStatus(401);

    const [userEmail, userPassword] = Buffer.from(authorizationHeader.split(' ')[1], 'base64').toString().split(':');
    
    if (!userEmail || !userPassword) return res.sendStatus(401);

    req.user = { email: userEmail, password: userPassword };
    next();
};

const validatePassword = (password) => {
    const passwordValidationRegex = /^(?=.*[a-z])(?=.*[A-Z]).{7,}$/;
    return passwordValidationRegex.test(password);
};

const validateEmail = (email) => {
    const emailValidationRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailValidationRegex.test(email);
};

const validateName = (name) => {
    const nameValidationRegex = /^[A-Za-z]+$/;
    return nameValidationRegex.test(name);
};

application.get('/healthz', validateQueryParams, async (req, res) => {
    try {
        const isDatabaseConnected = await verifyDatabaseConnection();
        const isAPIHealthy = await checkExternalAPI();

        if (isDatabaseConnected && isAPIHealthy) {
            res.status(200).set('Cache-Control', 'no-cache').send();
        } else {
            res.status(503).set('Cache-Control', 'no-cache').send();
        }
    } catch (err) {
        console.error('Error during health check:', err);
        res.status(500).send();
    }
});

application.post('/v1/user', validateQueryParams, async (req, res) => {
    const { emailAddress, userPassword, givenName, surname } = req.body;

    if (!emailAddress || !userPassword || !givenName || !surname) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    const validFields = ['emailAddress', 'userPassword', 'givenName', 'surname'];
    const requestFields = Object.keys(req.body);

    for (const field of requestFields) {
        if (!validFields.includes(field)) {
            return res.status(400).json({ error: `Invalid field: ${field}` });
        }
    }

    if (!validateEmail(emailAddress)) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    if (!validatePassword(userPassword)) {
        return res.status(400).json({ error: 'Password must be at least 7 characters long, with at least one uppercase and one lowercase letter' });
    }

    if (!validateName(givenName) || !validateName(surname)) {
        return res.status(400).json({ error: 'First name and last name must only contain alphabets' });
    }

    try {
        const hashedUserPassword = await bcrypt.hash(userPassword, 10);
        const newUser = await UserModel.create({ emailAddress, userPassword: hashedUserPassword, givenName, surname });
        res.status(201).json({ message: 'User created successfully' });
    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

application.get('/v1/user/self', validateQueryParams, basicAuthentication, async (req, res) => {
    const { email, password } = req.user;

    try {
        const user = await UserModel.findOne({ where: { emailAddress: email } });
        if (!user) return res.sendStatus(401);

        const passwordMatches = await bcrypt.compare(password, user.userPassword);
        if (!passwordMatches) return res.sendStatus(401);

        const { userPassword: _, ...userDetails } = user.dataValues;
        res.status(200).json(userDetails);
    } catch (error) {
        console.error('Error retrieving user information:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

application.put('/v1/user/self', validateQueryParams, basicAuthentication, async (req, res) => {
    const { email, password } = req.user;
    const { givenName, surname, userPassword: newUserPassword } = req.body;

    const validFields = ['givenName', 'surname', 'userPassword'];
    const requestFields = Object.keys(req.body);

    for (const field of requestFields) {
        if (!validFields.includes(field)) {
            return res.status(400).json({ error: `Invalid field: ${field}` });
        }
    }

    if (givenName && !validateName(givenName)) {
        return res.status(400).json({ error: 'First name must only contain alphabets' });
    }

    if (surname && !validateName(surname)) {
        return res.status(400).json({ error: 'Last name must only contain alphabets' });
    }

    if (newUserPassword && !validatePassword(newUserPassword)) {
        return res.status(400).json({ error: 'Password must be at least 7 characters long, with at least one uppercase and one lowercase letter' });
    }

    try {
        const user = await UserModel.findOne({ where: { emailAddress: email } });
        if (!user) return res.sendStatus(401);

        const passwordMatches = await bcrypt.compare(password, user.userPassword);
        if (!passwordMatches) return res.sendStatus(401);

        const updates = {};
        let isUpdateNeeded = false;

        if (givenName) {
            if (user.givenName === givenName) {
                return res.status(400).json({ error: 'No changes detected for givenName' });
            }
            updates.givenName = givenName;
            isUpdateNeeded = true;
        }

        if (surname) {
            if (user.surname === surname) {
                return res.status(400).json({ error: 'No changes detected for surname' });
            }
            updates.surname = surname;
            isUpdateNeeded = true;
        }

        if (newUserPassword) {
            const hashedNewPassword = await bcrypt.hash(newUserPassword, 10);
            updates.userPassword = hashedNewPassword;
            isUpdateNeeded = true;
        }

        if (isUpdateNeeded) {
            updates.updatedAt = new Date();
            await UserModel.update(updates, { where: { emailAddress: email } });
            return res.status(200).json({ message: 'User updated successfully' });
        }

        res.status(400).json({ error: 'No valid fields to update' });
    } catch (error) {
        console.error('Error updating user information:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

application.all('/healthz', (req, res) => {
    res.sendStatus(405);
});

application.all('/v1/user/self', (req, res) => {
    res.sendStatus(405);
});

application.all('/v1/user', (req, res) => {
    res.sendStatus(405);
});

const server = application.listen(serverPort, () => {
    console.log(`Server running on http://localhost:${serverPort}`);
    initializeDatabase();
});

export default application; // This exports the Express app
export { databaseConnection as sequelize, server }; // Export the server instance
