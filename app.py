from cs50 import SQL
from flask import Flask, flash, redirect, render_template, request, session
from flask_session import Session
from werkzeug.security import check_password_hash, generate_password_hash
from functools import wraps
from statistics import stdev

# Configure application
app = Flask(__name__)

# Configure filesystem for session
app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

# Configure SQLite database with CS50 python library
db = SQL("sqlite:///data.db")

QUESTION_AMOUNT = 10


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
    data = db.execute("SELECT username FROM users WHERE id = ?", session["user_id"])[0]

    # Query for player's total experience
    exp = db.execute(
        "SELECT SUM(experience_reward) FROM game_sessions WHERE id = ?",
        session["user_id"],
    )[0]["SUM(experience_reward)"]

    # If no games have been played yet
    if exp is None:
        exp = 0

    # Initialize level
    lvl = 1

    # Level system formula that converts total xp into levels, with the maximum increasing by ten points depending on the level
    while exp >= (100 + (10 * (lvl - 1))):
        exp = exp - (100 + (10 * (lvl - 1)))
        lvl = lvl + 1

    # Updating username in uppercase format
    data["username"] = str(data["username"]).upper()

    # User reached route via POST (as by submitting a form via POST)
    if request.method == "POST":
        # Names of the selected game modes as a string array
        game_mode_values = request.form.getlist("game_mode")

        # Ensure game mode is empty or not
        if not game_mode_values:
            flash("Add at least one game mode")
            return render_template(
                "index.html",
                data=data,
                exp=exp,
                lvl=lvl,
                formula=(100 + (10 * (lvl - 1))),
            )

        # Ensure at least one game mode selected
        else:
            # Sets the selected game modes array to the current session
            session["selected_gamemodes"] = game_mode_values

            # Redirect user to game page
            return redirect("/game")

    return render_template(
        "index.html", data=data, exp=exp, lvl=lvl, formula=(100 + (10 * (lvl - 1)))
    )


@app.route("/game", methods=["GET", "POST"])
@login_required
def game_page():
    """Game page"""

    # Concat the array that stores selected game modes into a string by separating them with commas
    selected_gamemodes = ", ".join(session.get("selected_gamemodes", []))

    return render_template(
        "game.html",
        selected_gamemodes=selected_gamemodes,
        QUESTION_AMOUNT=QUESTION_AMOUNT,
    )


@app.route("/results", methods=["GET", "POST"])
@login_required
def result_page():
    """Result and statistics page"""

    # User reached route via POST (JSON format via JavaScript)
    if request.method == "POST":
        # An array containing the statistics of 10 questions, each of which is an object, in JSON format
        data = request.get_json()["game_session_data"]

        # Inserts the statistics of each question one by one into the database
        for item in data:
            db.execute(
                "INSERT INTO game_sessions (id, reaction_time, operation_text, answer, question_type, experience_reward) VALUES (?, ?, ?, ?, ?, ?)",
                session["user_id"],
                float(item["reactionTime"]),
                item["operationText"],
                item["questionAnswer"],
                item["operationType"],
                item["experience"],
            )

        # Redirect user to results page again
        return redirect("/results")

    # User reached route via GET, without submitting a form
    else:
        # Query for statistics of the player's last 10 questions from the database
        dataset = db.execute(
            "SELECT * FROM game_sessions WHERE id = ? ORDER BY time_stamp DESC LIMIT ?",
            session["user_id"],
            QUESTION_AMOUNT,
        )

        # Initialize reaction data array
        reaction_data = []

        # Appends reaction time's one by one to the reaction data array
        for data in dataset:
            reaction_data.append(data["reaction_time"])

        # Average of correct answer reaction with 2 decimal points
        mean = float("{:.2f}".format(sum(reaction_data) / len(reaction_data)))

        # Standard deviation of correct answer reaction with 2 decimal points
        std = float("{:.2f}".format(stdev(reaction_data)))

        # Initialize z-score for determine deviations from the mean array
        zscore_data = []

        # Determines the count of symbols to represent how many standard deviations it deviates for each question
        for data in reaction_data:
            z = abs((data - mean) / std)
            if z < 1:
                z = 1
            elif 1 <= z <= 1.5:
                z = 2
            else:
                z = 3
            zscore_data.append(int(z))

        return render_template(
            "result.html", dataset=dataset, mean=mean, zscore_data=zscore_data, std=std
        )


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
