from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import requests
import datetime
from pymongo import MongoClient
import os
 
# --- NEW: Imports for Google Sign-In ---
from google.oauth2 import id_token
# Renamed to avoid conflict with the 'requests' library you're already using
from google.auth.transport import requests as google_requests 

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

# --- API KEYS & CONSTANTS ---
WEATHER_KEY = os.getenv("WEATHER_KEY", "44f2a63d4f4b58a23379e537caa9d6fb")
AQI_KEY = os.getenv("AQI_KEY", "4bf1511a-a18e-49f1-9439-d6bd0190f0af")
CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", '362952582119-n3pib5i1qe57tvv9ksh574uoo9rnf0cf.apps.googleusercontent.com')

WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"
FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"
AQI_URL_NEAREST = "http://api.airvisual.com/v2/nearest_city"

# --- MongoDB Connection ---
client = MongoClient("mongodb://localhost:27017/")
db = client["NimbusCast"]
forecast_collection = db["forecasts"]
search_history = db["search_history"]
users_collection = db["users"] # --- NEW: Collection for users ---

# --- Helper Functions ---
def kelvin_to_celsius(temp_k):
    return round(temp_k - 273.15, 1)

def country_code_to_flag(country_code):
    if not country_code:
        return ""
    return ''.join(chr(127397 + ord(c)) for c in country_code.upper())

def error_response(message, code=400):
    return jsonify({"error": message}), code

# --- Data Fetching Functions (Weather, Forecast, IP, AQI) ---
def get_weather_data_city(city):
    try:
        params = {"q": city, "appid": WEATHER_KEY}
        res = requests.get(WEATHER_URL, params=params).json()
        if str(res.get("cod")) != "200":
            return {"error": res.get("message", "City not found")}
        return {
            "city": res["name"], "country": res["sys"]["country"],
            "flag": country_code_to_flag(res["sys"]["country"]), "temp": kelvin_to_celsius(res["main"]["temp"]),
            "weather": res["weather"][0]["main"], "description": res["weather"][0]["description"],
            "humidity": res["main"]["humidity"], "wind": res["wind"]["speed"],
            "lat": res["coord"]["lat"], "lon": res["coord"]["lon"]
        }
    except Exception as e:
        return {"error": str(e)}

def get_forecast_city(city):
    try:
        cached = forecast_collection.find_one({"city": city})
        if cached and (datetime.datetime.utcnow() - cached["timestamp"]).seconds < 600:
            return {"forecast": cached["forecast"], "cached": True}

        params = {"q": city, "appid": WEATHER_KEY}
        res = requests.get(FORECAST_URL, params=params).json()
        if str(res.get("cod")) != "200":
            return {"error": res.get("message", "Forecast not found")}
        
        forecast = []
        for item in res["list"][:5]:
            dt = datetime.datetime.fromtimestamp(item["dt"])
            forecast.append({
                "date": dt.strftime("%a %d %b %I:%M %p"), "temp": kelvin_to_celsius(item["main"]["temp"]),
                "weather": item["weather"][0]["main"], "description": item["weather"][0]["description"]
            })

        forecast_collection.update_one(
            {"city": city},
            {"$set": {"city": city, "timestamp": datetime.datetime.utcnow(), "forecast": forecast}},
            upsert=True
        )
        return {"forecast": forecast, "cached": False}
    except Exception as e:
        return {"error": str(e)}

def get_location_from_ip(ip):
    try:
        res = requests.get(f"https://ipapi.co/{ip}/json/").json()
        return {
            "city": res.get("city"), "country": res.get("country"),
            "lat": res.get("latitude"), "lon": res.get("longitude")
        }
    except Exception as e:
        return {"error": str(e)}

def get_aqi_latlon(lat, lon):
    try:
        params = {"lat": lat, "lon": lon, "key": AQI_KEY}
        res = requests.get(AQI_URL_NEAREST, params=params).json()
        if res.get("status") != "success":
            return {"error": res.get("data", "AQI not found")}
        return {
            "city": res["data"]["city"], "state": res["data"]["state"],
            "country": res["data"]["country"], "aqi_us": res["data"]["current"]["pollution"]["aqius"],
            "main_pollutant": res["data"]["current"]["pollution"]["mainus"]
        }
    except Exception as e:
        return {"error": str(e)}

# --- Routes ---
@app.route("/")
def splash():
    """Serves the new splash screen."""
    return render_template("splash.html")

@app.route("/app")
def main_app():
    """Serves the main weather application (index.html)."""
    return render_template("index.html")

@app.route("/login")
def login():
    """Serves the login page."""
    return render_template("login.html")

@app.route("/quiz")
def quiz():
    return render_template("quiz.html")

@app.route("/cities")
def show_cities_page():
    return render_template("city_data.html")
    
@app.route("/weather/city", methods=["POST"])
def weather_city():
    data = request.get_json()
    city = data.get("city")
    if not city:
        return error_response("City name is required")

    # Save searched city
    search_history.update_one(
        {"city": city},
        {"$set": {"city": city, "last_searched": datetime.datetime.utcnow()}},
        upsert=True
    )
    return jsonify(get_weather_data_city(city))

@app.route("/forecast/city", methods=["POST"])
def forecast_city():
    data = request.get_json()
    city = data.get("city")
    if not city:
        return error_response("City name is required")
    return jsonify(get_forecast_city(city))

@app.route("/aqi/city", methods=["POST"])
def aqi_city():
    data = request.get_json()
    city = data.get("city")
    if not city:
        return error_response("City name is required")

    weather_data = get_weather_data_city(city)
    if "error" in weather_data:
        return jsonify(weather_data)

    lat = weather_data.get("lat")
    lon = weather_data.get("lon")
    if not lat or not lon:
        return error_response("Coordinates not found")
    return jsonify(get_aqi_latlon(lat, lon))

@app.route("/weather/ip", methods=["GET"])
def weather_ip():
    ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    location = get_location_from_ip(ip)
    if not location.get("city"):
        return error_response("Could not detect location")
    weather = get_weather_data_city(location["city"])
    forecast = get_forecast_city(location["city"])
    return jsonify({
        "location": {
            "city": location["city"], "country": location["country"],
            "flag": country_code_to_flag(location["country"]),
            "lat": location["lat"], "lon": location["lon"]
        },
        "weather": weather,
        "forecast": forecast
    })

@app.route("/history/<city>", methods=["GET"])
def get_history(city):
    try:
        records = forecast_collection.find({"city": city}).sort("timestamp", -1)
        history = [{"city": r["city"], "timestamp": r["timestamp"].strftime("%Y-%m-%d %H:%M:%S"), "forecast": r["forecast"]} for r in records]
        if not history:
            return jsonify({"message": f"No history found for {city}."})
        return jsonify({"history": history})
    except Exception as e:
        return jsonify({"error": str(e)})

@app.route("/searched-cities", methods=["GET"])
def get_searched_cities():
    try:
        cities = list(search_history.find({}, {"_id": 0, "city": 1}).sort("last_searched", -1))
        if not cities:
            return jsonify({"message": "No searched cities yet."})
        city_names = [c["city"] for c in cities]
        return jsonify({"searched_cities": city_names})
    except Exception as e:
        return jsonify({"error": str(e)})

# --- Route for Google Sign-In ---
@app.route('/tokensignin', methods=['POST'])
def token_signin():
    try:
        token = request.json['id_token']
        idinfo = id_token.verify_oauth2_token(token, google_requests.Request(), CLIENT_ID)
        
        # Save or update user in the database
        users_collection.update_one(
            {'email': idinfo['email']},
            {
                '$set': {
                    'name': idinfo['name'],
                    'google_id': idinfo['sub'],
                    'last_login': datetime.datetime.utcnow()
                }
            },
            upsert=True
        )
        
        print(f"User signed in: {idinfo['name']} ({idinfo['email']})")
        return jsonify({"status": "success", "user": idinfo['email']}), 200

    except ValueError as e:
        print(f"Token Error: {e}")
        return error_response("Invalid token", 401)
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return error_response("An unexpected error occurred", 500)

# --- Run Server ---
if __name__ == "__main__":
    app.run(port=5000, debug=True)