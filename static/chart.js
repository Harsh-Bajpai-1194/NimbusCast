// chart.js – handles displaying weather forecast charts using Chart.js

let forecastChart = null;

function renderForecastChart(forecastData) {
    const ctx = document.getElementById("forecastChart").getContext("2d");

    // Extract labels (dates) and temperatures
    const labels = forecastData.map(day => day.date);
    const temps = forecastData.map(day => day.temp);

    // Destroy old chart if it exists
    if (forecastChart) {
        forecastChart.destroy();
    }

    // Create new line chart
    forecastChart = new Chart(ctx, {
        type: "line",
        data: {
            labels: labels,
            datasets: [{
                label: "Daily Temperature (°C)",
                data: temps,
                borderColor: "rgba(35, 89, 253, 1)",
                backgroundColor: "rgba(35, 89, 253, 0.2)",
                tension: 0.4,
                fill: true,
                pointBackgroundColor: "#2359fd",
                pointRadius: 5
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: true },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `🌡 ${context.raw}°C`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: "Temperature (°C)"
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: "Date"
                    }
                }
            }
        }
    });
}
