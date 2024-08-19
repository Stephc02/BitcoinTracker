import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  VictoryChart,
  VictoryLine,
  VictoryAxis,
  VictoryScatter,
  VictoryTooltip,
} from "victory";
import "./App.css";

const App = () => {
  const [currentChartData, setCurrentChartData] = useState([]);
  const [currentIndicator, setCurrentIndicator] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timePeriod, setTimePeriod] = useState("1m"); // Default to 1 month

  const fetchOhlcData = async (interval, startDate) => {
    const ohlcResponse = await axios.get(
      `https://api.kraken.com/0/public/OHLC?pair=XBTUSD&interval=${interval}&since=${startDate}&_=${Date.now()}`
    );

    const ohlcData = ohlcResponse.data.result.XXBTZUSD;
    return ohlcData.map((d) => [
      d[0] * 1000, // Converting Unix timestamp to milliseconds
      parseFloat(d[1]), // Open price
      parseFloat(d[2]), // High price
      parseFloat(d[3]), // Low price
      parseFloat(d[4]), // Close price
    ]);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        let data;
        const now = Math.floor(Date.now() / 1000); // Current timestamp in seconds
        let startDate;
        let interval;

        switch (timePeriod) {
          case "1m":
            interval = "240"; // 4 hour intervals
            startDate = now - 30 * 24 * 60 * 60; // 1 month ago
            break;
          case "1y":
            interval = "1440"; // 1 day intervals
            startDate = now - 365 * 24 * 60 * 60; // 1 year ago
            break;
          case "2y":
            interval = "1440"; // 1 day intervals
            startDate = now - 2 * 365 * 24 * 60 * 60; // 2 years ago
            break;
          case "3y":
            interval = "1440"; // 1 day intervals
            startDate = now - 3 * 365 * 24 * 60 * 60; // 3 years ago
            break;
          default:
            interval = "240"; // Default to 4 hour intervals
            startDate = now - 30 * 24 * 60 * 60; // Default to 1 month ago
        }

        data = await fetchOhlcData(interval, startDate);
        setCurrentChartData(data);

        // Calculate percentage change for the current time period
        const percentageChange =
          ((data[data.length - 1][4] - data[0][4]) / data[0][4]) * 100;
        setCurrentIndicator(percentageChange);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timePeriod]);

  const separator = (numb) => {
    const str = numb.toString().split(".");
    str[0] = str[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return str.join(".");
  };

  const label = (price) => {
    const date = new Date(price[0]).toLocaleDateString("en-US");
    return `${date}\n$${separator(price[4].toFixed(2))}`;
  };

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="container">
      <h1 className="title">Bitcoin Tracker</h1>
      <div className="general">
        <div className="price">
          Current Price: $
          {separator(
            currentChartData[currentChartData.length - 1][4].toFixed(2)
          )}
        </div>
        <div
          className="percentageContainer"
          style={{ backgroundColor: currentIndicator < 0 ? "red" : "green" }}
        >
          <div className="percentage">{currentIndicator?.toFixed(2)}%</div>
        </div>
      </div>
      <div className="btnContainer">
        <button className="button" onClick={() => setTimePeriod("1m")}>
          1 Month
        </button>
        <button className="button" onClick={() => setTimePeriod("1y")}>
          1 Year
        </button>
        <button className="button" onClick={() => setTimePeriod("2y")}>
          2 Years
        </button>
        <button className="button" onClick={() => setTimePeriod("3y")}>
          3 Years
        </button>
      </div>
      <div className="chart">
        <VictoryChart
          width={800}
          height={400}
          padding={{ top: 55, bottom: 40, left: 35, right: 35 }}
        >
          <VictoryLine
            animate
            data={currentChartData.map((price) => ({
              x: price[0],
              y: price[4],
            }))}
            style={{
              data: {
                stroke: "#f89620",
                strokeWidth: 2,
              },
            }}
          />
          <VictoryScatter
            labelComponent={<VictoryTooltip flyoutWidth={70} />}
            style={{ data: { fill: "white" } }}
            size={4}
            data={currentChartData.map((price) => ({
              x: price[0],
              y: price[4],
              label: label(price),
            }))}
            events={[
              {
                target: "data",
                eventHandlers: {
                  onMouseOver: () => [
                    { target: "labels", mutation: () => ({ active: true }) },
                  ],
                  onMouseOut: () => [
                    { target: "data", mutation: () => {} },
                    { target: "labels", mutation: () => ({ active: false }) },
                  ],
                },
              },
            ]}
          />
          <VictoryAxis
            style={{
              axis: { stroke: "transparent" },
              ticks: { stroke: "transparent" },
              tickLabels: { fill: "transparent" },
            }}
          />
        </VictoryChart>
      </div>
    </div>
  );
};

export default App;
