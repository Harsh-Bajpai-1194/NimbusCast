# 🌦 NimbusCast  

Link of Repository clone 👇

```yaml
https://github.com/Harsh-Bajpai-1194/NimbusCast.git
```

A simple weather application built with **Flask (Python backend)** + **HTML, CSS, JavaScript frontend**.  
It uses the **OpenWeather API** to fetch real-time weather and forecast data, and **Chart.js** to visualize temperature trends.  

## API Data

```yaml
https://api.openweathermap.org/data/2.5/forecast?q=Kanpur&appid=44f2a63d4f4b58a23379e537caa9d6fb&units=metric  

---

## 🚀 Features  

- Search weather by **city name**  
- Get weather by **current location** (using geolocation)  
- **5-day forecast (10 data points shown)**  
- Dynamic animated backgrounds based on weather conditions  
- Interactive **temperature chart (Chart.js)**  
- Mobile-friendly with scrollable layout  

---

## 📦 Requirements  

- Python 3.8+  
- Flask  
- Requests  

Install dependencies:  

```bash
pip install flask requests
```

---

## 🔑 API Key  

This app uses **OpenWeatherMap API**.  

1. Create a free account at [OpenWeather](https://openweathermap.org/api)  
2. Get your API key.  
3. Replace it in:  
   - `static/script.js` → `const API_KEY = "YOUR_KEY_HERE";`  
   - `app.py` → `API_KEY = "YOUR_KEY_HERE"`  

---

## ▶️ How to Run the App  

```bash
python app.py
```

Then open in browser:  
👉 `http://127.0.0.1:5000/`

---

## 📊 Forecast Chart Example  

The forecast includes a **line chart** showing temperature variations over the next 5 days (10 intervals).  

---

## 📂 Project Structure  

```yaml

📦 weather-app
 ┣ 📂 static
 ┃ ┣ 📜 static.css      # Styles  
 ┃ ┣ 📜 script.js       # Frontend logic + API calls  
 ┃ ┣ 📜 chart.js        # Chart.js setup  
 ┣ 📂 templates
 ┃ ┗ 📜 index.html      # Main UI  
 ┣ 📜 app.py            # Flask backend  
 ┣ 📜 README.md         # Documentation  
```

---

✅ Ready to use! Just plug in your API key and start exploring weather data.  

