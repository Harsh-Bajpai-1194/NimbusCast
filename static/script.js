const API_KEY = "44f2a63d4f4b58a23379e537caa9d6fb";

// ---- Weather Sounds ----
const sounds = {
    clear: new Audio("static/sounds/clear.mp3"),
    cloud: new Audio("static/sounds/cloud.mp3"),
    rain: new Audio("static/sounds/rain.mp3"),
    thunder: new Audio("static/sounds/thunder.mp3"),
    snow: new Audio("static/sounds/snow.mp3"),
    mist: new Audio("static/sounds/mist.mp3"),
    default: new Audio("static/sounds/default.mp3")
};
Object.values(sounds).forEach(s => {
    s.loop = true;
    s.volume = 0.5;
});

// ✅ MODIFIED BLOCK
// Removed code that created the button.
// Now, we just find the button from the HTML.
let soundEnabled = true;
const soundBtn = document.getElementById("muteBtn");

// Attach the same logic to the new button
soundBtn.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
        soundBtn.innerHTML = "🔇"; // Use innerHTML for emoji
        playWeatherSound("default");
    } else {
        soundBtn.innerHTML = "🔊"; // Use innerHTML for emoji
        Object.values(sounds).forEach(s => {
            s.pause();
            s.currentTime = 0;
        });
    }
});
// Removed the old .prepend() line

function playWeatherSound(weather) {
    if (!soundEnabled) return;
    Object.values(sounds).forEach(s => {
        s.pause();
        s.currentTime = 0;
    });

    weather = weather.toLowerCase();
    if (weather.includes("clear")) sounds.clear.play();
    else if (weather.includes("cloud")) sounds.cloud.play();
    else if (weather.includes("rain")) sounds.rain.play();
    else if (weather.includes("thunder")) sounds.thunder.play();
    else if (weather.includes("snow")) sounds.snow.play();
    else if (weather.includes("mist") || weather.includes("fog")) sounds.mist.play();
    else sounds.default.play();
}

function getWeatherIcon(weather) {
    weather = weather.toLowerCase();
    if (weather.includes("clear")) return "☀️";
    if (weather.includes("cloud")) return "☁️";
    if (weather.includes("rain")) return "🌧️";
    if (weather.includes("thunder")) return "⛈️";
    if (weather.includes("snow")) return "❄️";
    if (weather.includes("mist") || weather.includes("fog")) return "🌫️";
    return "🌍";
}

function updateBackground(weather) {
    const body = document.body;
    body.className = "";
    weather = weather.toLowerCase();
    if (weather.includes("clear")) body.classList.add("clear-bg");
    else if (weather.includes("cloud")) body.classList.add("cloudy-bg");
    else if (weather.includes("rain")) body.classList.add("rainy-bg");
    else if (weather.includes("snow")) body.classList.add("snowy-bg");
    else body.classList.add("default-bg");
    playWeatherSound(weather);
}

// ✅ NEW HELPER FUNCTION
/**
 * Translates pollutant codes (e.g., "p2") into human-readable names (e.g., "PM2.5").
 * @param {string} code - The pollutant code from the API.
 * @returns {string} - The human-readable name or the original code if not found.
 */
function getPollutantName(code) {
    if (!code) return "N/A";
    const pollutants = {
        p2: "PM2.5", // Fine Particulates
        p1: "PM10", // Coarse Particulates
        o3: "Ozone",
        co: "Carbon Monoxide",
        so2: "Sulfur Dioxide",
        no2: "Nitrogen Dioxide"
    };
    // Return the full name, or the uppercase code if not in our list
    return pollutants[code.toLowerCase()] || code.toUpperCase();
}


// ✅ UPDATED FUNCTION
function updateAQIBox(aqiData) {
    const aqiBox = document.getElementById("aqiBox");
    const aqiDetails = document.getElementById("aqiDetails");

    aqiBox.classList.remove("good", "moderate", "unhealthy", "hazardous");

    if (!aqiData || aqiData.error || !aqiData.aqi_us) {
        aqiBox.textContent = "🌫 AQI: --";
        aqiDetails.textContent = "Air Quality data unavailable";
        return;
    }

    const aqi = aqiData.aqi_us;
    aqiBox.textContent = `🌫 AQI: ${aqi}`;

    // Use the helper function to get the friendly name
    const pollutantCode = aqiData.main_pollutant;
    const pollutantName = getPollutantName(pollutantCode);
    aqiDetails.textContent = `Main Pollutant: ${pollutantName}`;

    if (aqi <= 50) {
        aqiBox.classList.add("good");
    } else if (aqi <= 100) {
        aqiBox.classList.add("moderate");
    } else if (aqi <= 200) {
        aqiBox.classList.add("unhealthy");
    } else {
        aqiBox.classList.add("hazardous");
    }
}

// ✅ Universal Country Code → Flag Emoji
function countryCodeToFlag(code) {
    return code
        .toUpperCase()
        .replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt()));
}

// ---- API Calls ----
async function fetchWeather(city) {
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`;
    const res = await fetch(url);
    return await res.json();
}

async function fetchForecast(city) {
    const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`;
    const res = await fetch(url);
    return await res.json();
}

async function fetchAQI(city, state, country) {
    try {
        const res = await fetch("/aqi/city", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ city, state, country })
        });
        return await res.json();
    } catch {
        return { error: "AQI fetch failed" };
    }
}

function renderForecastChart(data) {
    const ctx = document.getElementById("forecastChart").getContext("2d");
    if (window.myChart) window.myChart.destroy();

    window.myChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: data.map(d => d.date),
            datasets: [{
                label: "Temperature (°C)",
                data: data.map(d => d.temp),
                borderColor: "blue",
                backgroundColor: "lightblue",
                fill: true,
                tension: 0.3
            }]
        },
        options: { responsive: true, plugins: { legend: { display: true } } }
    });
}

// ---- Search Button ----
document.getElementById("searchBtn").addEventListener("click", async() => {
    const city = document.getElementById("cityInput").value.trim();
    const resultDiv = document.getElementById("result");
    if (!city) { alert("Enter a city name!"); return; }

    resultDiv.innerHTML = `<div class="spinner"></div><p>Fetching weather for <b>${city}</b>...</p>`;

    try {
        const weatherData = await fetchWeather(city);
        const forecastData = await fetchForecast(city);

        if (weatherData.cod !== 200) {
            resultDiv.innerHTML = `❌ ${weatherData.message}`;
            return;
        }

        const aqiData = await fetchAQI(weatherData.name, weatherData.name, weatherData.sys.country);
        const flag = countryCodeToFlag(weatherData.sys.country);

        document.getElementById("cityName").innerHTML =
            `${getWeatherIcon(weatherData.weather[0].main)} ${weatherData.name}, ${weatherData.sys.country} ${flag}`;
        document.getElementById("weatherDesc").innerText =
            `${getWeatherIcon(weatherData.weather[0].main)} ${weatherData.weather[0].description}`;
        document.getElementById("temp").innerText = `🌡 ${weatherData.main.temp.toFixed(1)}°C`;
        document.getElementById("humidity").innerText = `💧 Humidity: ${weatherData.main.humidity}%`;
        document.getElementById("wind").innerText = `🌬 Wind: ${weatherData.wind.speed} m/s`;

        updateAQIBox(aqiData); // This will now use the updated function

        const forecastDiv = document.getElementById("forecast");
        forecastDiv.innerHTML = "";
        const forecastArr = forecastData.list.filter((_, i) => i % 8 === 0).map(day => {
            const d = new Date(day.dt * 1000);
            const date = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;

            forecastDiv.innerHTML += `
        <div class="forecast-card">
          <p><b>${date}</b></p>
          <p>${getWeatherIcon(day.weather[0].main)} ${day.weather[0].description}</p>
          <p>🌡 ${day.main.temp.toFixed(1)}°C</p>
        </div>
      `;
            return { date, temp: day.main.temp.toFixed(1) };
        });

        renderForecastChart(forecastArr);
        updateBackground(weatherData.weather[0].main);
        resultDiv.innerHTML = "";

    } catch (error) {
        resultDiv.innerHTML = "⚠ API error. Try later.";
        console.error(error);
    }
});

// ✅ Enter key = Search button
// ✅ CTRL+Enter = Location button
document.getElementById("cityInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.ctrlKey) {
        e.preventDefault();
        document.getElementById("searchBtn").click();
    }
    if (e.key === "Enter" && e.ctrlKey) {
        e.preventDefault();
        document.getElementById("locBtn").click();
    }
});

// ---- Location Button ----
document.getElementById("locBtn").addEventListener("click", () => {
    const resultDiv = document.getElementById("result");
    if (!navigator.geolocation) {
        alert("Geolocation not supported.");
        return;
    }

    resultDiv.innerHTML = `<div class="spinner"></div><p>Fetching your location...</p>`;

    navigator.geolocation.getCurrentPosition(async(pos) => {
        const { latitude, longitude } = pos.coords;
        try {
            const urlWeather = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`;
            const urlForecast = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}&units=metric`;

            const weatherData = await (await fetch(urlWeather)).json();
            const forecastData = await (await fetch(urlForecast)).json();

            if (weatherData.cod !== 200) {
                resultDiv.innerHTML = `❌ ${weatherData.message}`;
                return;
            }

            const aqiData = await fetchAQI(weatherData.name, weatherData.name, weatherData.sys.country);

            let cityName = weatherData.name;
            if (latitude >= 26.3 && latitude <= 26.6 && longitude >= 80.2 && longitude <= 80.5) {
                cityName = "Kanpur";
            }

            const flag = countryCodeToFlag(weatherData.sys.country);

            document.getElementById("cityName").innerHTML =
                `${getWeatherIcon(weatherData.weather[0].main)} ${cityName}, ${weatherData.sys.country} ${flag}`;
            document.getElementById("weatherDesc").innerText =
                `${getWeatherIcon(weatherData.weather[0].main)} ${weatherData.weather[0].description}`;
            document.getElementById("temp").innerText = `🌡 ${weatherData.main.temp.toFixed(1)}°C`;
            document.getElementById("humidity").innerText = `💧 Humidity: ${weatherData.main.humidity}%`;
            document.getElementById("wind").innerText = `🌬 Wind: ${weatherData.wind.speed} m/s`;

            updateAQIBox(aqiData); // This will now use the updated function

            const forecastDiv = document.getElementById("forecast");
            forecastDiv.innerHTML = "";
            const forecastArr = forecastData.list.filter((_, i) => i % 8 === 0).map(day => {
                const d = new Date(day.dt * 1000);
                const date = `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;

                forecastDiv.innerHTML += `
          <div class="forecast-card">
            <p><b>${date}</b></p>
            <p>${getWeatherIcon(day.weather[0].main)} ${day.weather[0].description}</p>
            <p>🌡 ${day.main.temp.toFixed(1)}°C</p>
          </div>
        `;
                return { date, temp: day.main.temp.toFixed(1) };
            });

            renderForecastChart(forecastArr);
            updateBackground(weatherData.weather[0].main);
            resultDiv.innerHTML = "";

        } catch (error) {
            resultDiv.innerHTML = "⚠ API error. Try later.";
            console.error(error);
        }
    }, () => {
        resultDiv.innerHTML = "⚠ Unable to fetch your location.";
    });
});