const fs = require("fs");
const crypto = require("crypto")
const util = require("util")

const scrypt = util.promisify(crypto.scrypt)

class UsersRepository {
    constructor(filename) {
        if (!filename) {
            throw new Error("Creating a collection requires a filename");
        }

        this.filename = filename;

        try {
            fs.accessSync(this.filename);
        } catch (err) {
            fs.writeFileSync(this.filename, "[]");
        }
    }

    async getAll() {
        //open the file
        const contents = await fs.promises.readFile(this.filename, { encoding: 'utf8' })

        //parse the contents
        return JSON.parse(contents);
    }

    async create(attrs) {

        attrs.id = this.randomId();

        const salt = crypto.randomBytes(8).toString('hex');

        const hashed = await scrypt(attrs.password, salt, 64);

        const records = await this.getAll();

        const record = {
            ...attrs,
            password: `${hashed.toString("hex")}.${salt}`
        }

        records.push(record);

        //write the updated records array back to this.filename(users.json)
        await this.writeAll(records)

        return record;
    }

    async writeAll(records) {
        await fs.promises.writeFile(this.filename, JSON.stringify(records, null, 2))
    }

    async comparePasswords(saved, supplied) {
        const result = saved.split(".");
        const hashed = result[0];
        const salt = result[1];

        const hashedSuppliedBuf = await scrypt(supplied, salt, 64);

        return hashed === hashedSuppliedBuf.toString("hex");
    }

    randomId() {
        return crypto.randomBytes(4).toString("hex");
    }

    async getOne(id) {
        const records = await this.getAll();
        return records.find(record => record.id === id)
    }

    async delete(id) {
        const records = await this.getAll();

        const fileteredRecords = records.filter(record => record.id !== id)

        await this.writeAll(fileteredRecords);
    }

    async update(id, attrs) {
        const records = await this.getAll();
        const record = records.find(record => record.id === id);

        if (!record) {
            throw new Error(`Record with id ${id} not found`);
        }

        Object.assign(record, attrs);

        await this.writeAll(records)
    }

    async getOneBy(filters) {
        const records = await this.getAll();

        for (let record of records) {
            let found = true;

            for (let key in filters) {
                if (record[key] !== filters[key]) {
                    found = false;
                }
            }

            if (found === true) {
                return record;
            }
        }
    }
}

const dbWorking = async () => {
    const db = new UsersRepository("users.json")

    // Get all Users
    const users = await db.getAll()
    console.log(users)

    // Create a new user
    // await db.create({
    //     email: "test11@test.com",
    //     password: "abcd"
    // })
    //console.log("User created successfully")

    // Update existing records
    // await db.update("5fbb0fe9", { password: "pass2" })
    // console.log("User updated successfully")

    // Get a record by applying filters
    // const user = await db.getOneBy({ email: "test11@test.com" })
    // console.log("User fetched successfully")
    // console.log(user)

    // Delete a record
    // await db.delete("5fbb0fe9");
    // console.log("User deleted successfully")
}

dbWorking();

module.exports = new UsersRepository("users.json");

// Working in Another File
// const repo = require("./users.js")
// repo.getAll()