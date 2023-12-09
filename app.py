from cs50 import SQL
from flask import Flask, flash, redirect, render_template, request, session
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash
from functools import wraps

# Configure application
app = Flask(__name__)

# Configure filesystem for session
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Configure SQLite database with CS50 python library
db = SQL("sqlite:///data.db")


def login_required(f):
    """
    Decorate routes to require login.
    http://flask.pocoo.org/docs/0.12/patterns/viewdecorators/
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if session.get("user_id") is None:
            return redirect("/login")
        return f(*args, **kwargs)
    return decorated_function


@app.after_request
def after_request(response):
    """Ensure responses aren't cached"""
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Expires"] = 0
    response.headers["Pragma"] = "no-cache"
    return response


@app.route("/", methods=["GET", "POST"])
@login_required
def index():
    """Configure game modes"""

    # Query for user informations when the page is loaded
    data = db.execute("SELECT username,lvl,xp FROM users WHERE id = ?", session["user_id"])[0]

    # Updating username in uppercase format
    data["username"] = str(data["username"]).upper()

    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":

        # Set selected game modes checkbox information to a variable
        game_mode_values = request.form.getlist("game_mode")

        # Ensure at least one game mode selected
        if not game_mode_values:
            flash("Add at least one game mode")
            return render_template("index.html", data=data)
        else:

            # Redirect user to game page
            return redirect("/game")

    return render_template("index.html", data=data)


@app.route("/game", methods=["GET", "POST"])
@login_required
def game_page():
    """Game page"""

    return render_template("game.html")


@app.route("/login", methods=["GET", "POST"])
def login():
    """Log user in"""

    # Forget any user_id
    session.clear()

    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":
        # Ensure username was submitted
        if not request.form.get("username"):
            flash("Must provide username")
            return render_template("login.html")

        # Ensure password was submitted
        elif not request.form.get("password"):
            flash("Must provide password")
            return render_template("login.html")

        # Query database for username
        rows = db.execute(
            "SELECT * FROM users WHERE username = ?", request.form.get("username")
        )

        # Ensure username exists and password is correct
        if len(rows) != 1 or not check_password_hash(
            rows[0]["hash"], request.form.get("password")
        ):
            flash("Invalid username and/or password")
            return render_template("login.html")

        # Remember which user has logged in
        session["user_id"] = rows[0]["id"]

        # Redirect user to home page
        return redirect("/")

    # User reached route via GET (as by clicking a link or via redirect)
    else:
        return render_template("login.html")


@app.route("/logout")
def logout():
    """Log user out"""

    # Forget any user_id
    session.clear()

    # Redirect user to login form
    return redirect("/")


@app.route("/register", methods=["GET", "POST"])
def register():
    """Register user"""

    # Forget any user_id
    session.clear()

    # User reached route as by submitting a form via POST
    if request.method == "POST":
        # Ensure username was submitted
        if not request.form.get("username"):
            flash("Must provide username")
            return render_template("register.html")

        # Query for whether this person's name exists in the database
        contains = db.execute(
            "SELECT username FROM users WHERE username = ?",
            request.form.get("username"),
        )

        # Ensure whether this person's name exists or not
        if contains:
            flash("Username already exists")
            return render_template("register.html")

        # Ensure both password and confirmation was submitted
        if not request.form.get("password") or not request.form.get("confirmation"):
            flash("Must provide both the password and the confirmation password")
            return render_template("register.html")

        # Ensure password and confirmation is match
        if request.form.get("password") != request.form.get("confirmation"):
            flash("Passwords do not match")
            return render_template("register.html")

        # Hash password
        hashPassword = generate_password_hash(request.form.get("password"))

        # Insert the hashed password to the database
        db.execute(
            "INSERT INTO users (username, hash) VALUES (?, ?)",
            request.form.get("username"),
            hashPassword,
        )

        # Redirect user to login form
        return redirect("/login")

    # User reached route via GET
    else:
        return render_template("register.html")
