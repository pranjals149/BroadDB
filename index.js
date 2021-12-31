const express = require("express");
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session")
const db = require("./database/users")

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieSession({
    keys: ["abcde"]
}));

app.get("/signup", (req, res) => {
    res.send(`
        <div>
            Your ID is ${req.session.userId}
            <form method="POST">
                <input name="email" placeholder="email" />
                <input name="password" placeholder="password" />
                <input name="passwordConfirmation" placeholder="passwordConfirmation" />

                <button>Sign Up</button>
            </form>
        </div>
    `)
})

app.post("/signup", async (req, res) => {
    const { email, password, passwordConfirmation } = req.body;

    const existingUser = await db.getOneBy({
        email: email
    })

    if (existingUser) {
        return res.send("Email already exists")
    }

    if (password !== passwordConfirmation) {
        return res.send("Passwords must match")
    }

    //create a user in the db
    const user = await db.create({
        email,
        password
    })

    //store the id of that user inside the users cookie
    req.session.userId = user.id; //added by cookie-session

    res.send("Account Created")
})

app.get("/signout", (req, res) => {
    req.session = null;
    res.send("You are logged out")
})

app.get("/signin", (req, res) => {
    res.send(`
        <div>
            <form method="POST">
                <input name="email" placeholder="email" />
                <input name="password" placeholder="password" />

                <button>Sign In</button>
            </form>
        </div>
    `)
})

app.post("/signin", async (req, res) => {
    const { email, password } = req.body;

    const user = await db.getOneBy({ email });

    if (!user) {
        return res.send("Email does not exists");
    }

    const validPass = await db.comparePasswords(user.password, password);

    if (!validPass) {
        return res.send("Invalid password");
    }

    req.session.userId = user.id;
    res.send("You are signed In")
})

app.listen(3001)