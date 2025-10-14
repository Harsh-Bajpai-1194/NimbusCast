from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import requests
import datetime

app = Flask(__name__, static_folder="static", template_folder="templates")
CORS(app)

API_KEY = "44f2a63d4f4b58a23379e537caa9d6fb"
WEATHER_URL = "https://api.openweathermap.org/data/2.5/weather"
FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"

# --- Helpers ---
def kelvin_to_celsius(temp_k):
    return round(temp_k - 273.15, 1)

def country_code_to_flag(country_code):
    if not country_code:
        return ""
    return ''.join(chr(127397 + ord(c)) for c in country_code.upper())

def get_weather_data_city(city):
    try:
        params = {"q": city, "appid": API_KEY}
        res = requests.get(WEATHER_URL, params=params).json()
        if str(res.get("cod")) != "200":
            return {"error": res.get("message", "City not found")}
        return {
            "city": res["name"],
            "country": res["sys"]["country"],
            "flag": country_code_to_flag(res["sys"]["country"]),
            "temp": kelvin_to_celsius(res["main"]["temp"]),
            "weather": res["weather"][0]["main"],
            "description": res["weather"][0]["description"],
            "humidity": res["main"]["humidity"],
            "wind": res["wind"]["speed"]
        }
    except Exception as e:
        return {"error": str(e)}

def get_forecast_city(city):
    try:
        params = {"q": city, "appid": API_KEY}
        res = requests.get(FORECAST_URL, params=params).json()
        if str(res.get("cod")) != "200":
            return {"error": res.get("message", "Forecast not found")}
        forecast = []
        for item in res["list"]:
            dt = datetime.datetime.fromtimestamp(item["dt"])
            if dt.hour == 12:
                forecast.append({
                    "date": dt.strftime("%a %d %b"),
                    "temp": kelvin_to_celsius(item["main"]["temp"]),
                    "weather": item["weather"][0]["main"],
                    "description": item["weather"][0]["description"]
                })
        return {"forecast": forecast[:5]}
    except Exception as e:
        return {"error": str(e)}

def get_location_from_ip(ip):
    try:
        res = requests.get(f"https://ipapi.co/{ip}/json/").json()
        return {
            "city": res.get("city"),
            "country": res.get("country"),
            "lat": res.get("latitude"),
            "lon": res.get("longitude")
        }
    except Exception as e:
        return {"error": str(e)}

# --- Routes ---
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/weather/city", methods=["POST"])
def weather_city():
    data = request.get_json()
    city = data.get("city")
    return jsonify(get_weather_data_city(city))

@app.route("/forecast/city", methods=["POST"])
def forecast_city():
    data = request.get_json()
    city = data.get("city")
    return jsonify(get_forecast_city(city))

@app.route("/weather/ip", methods=["GET"])
def weather_ip():
    ip = request.headers.get("X-Forwarded-For", request.remote_addr)
    location = get_location_from_ip(ip)

    if not location.get("city"):
        return jsonify({"error": "Could not detect location"})

    weather = get_weather_data_city(location["city"])
    forecast = get_forecast_city(location["city"])

    return jsonify({
        "location": {
            "city": location["city"],
            "country": location["country"],
            "flag": country_code_to_flag(location["country"]),
            "lat": location["lat"],
            "lon": location["lon"]
        },
        "weather": weather,
        "forecast": forecast
    })

if __name__ == "__main__":
    app.run(debug=True)
    